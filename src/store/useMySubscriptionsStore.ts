import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccessType, BillingCycle, BundleProvider, OwnedSubscription, UsageFrequency } from "@/types/subscription";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { trackEvent } from "@/lib/events";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { monthlyEquivalent, ownedPriceAmount } from "@/lib/utils";

interface AddInput {
  subscriptionId: string;
  planName: string;
  /** Charged per `billing` cycle — see OwnedSubscription.priceAmount. */
  priceAmount: number;
  billing: BillingCycle;
  nextRenewal: string;
  /** Set true when this add is triggered by the top-of-panel Heart button
   * on a not-yet-owned subscription, so "keep" and "add" happen as one
   * action instead of a dead click. */
  kept?: boolean;
  /** Optional — defaults to 'direct' when omitted (mirrors the DB
   * column's own default), so none of today's add call sites (none of
   * which know about access types yet — that's Sprint 2's bundle-
   * selection UI) need to change. */
  accessType?: AccessType;
  bundleProvider?: BundleProvider;
  usageFrequency?: UsageFrequency;
  /** Sprint 5 — only meaningful when accessType is 'promotional'. */
  promoEndDate?: string;
}

interface MySubscriptionsState {
  owned: OwnedSubscription[];
  hydrated: boolean;
  /** Set once signed in — from here on, add/remove/toggleKept also write
   * through to Supabase's owned_subscriptions table, RLS-scoped to this
   * id, instead of staying localStorage-only. */
  userId: string | null;
  /** True when loading or migrating this user's account failed. The local
   * copy is left untouched (nothing is lost) and retried on the next
   * sign-in/page load; useSubscriptionsReady treats it as "show local". */
  syncFailed: boolean;
  setHydrated: () => void;
  add: (input: AddInput) => void;
  remove: (ownedId: string) => void;
  toggleKept: (ownedId: string) => void;
  /** Sprint 4 — the only edit surface for an already-tracked entry today;
   * onboarding is otherwise add-only. */
  updateUsageFrequency: (ownedId: string, usageFrequency: UsageFrequency) => void;
  /** The only edit surface for bundleProvider today (DetailPanel's
   * OverviewTab) — mirrors updateUsageFrequency exactly. undefined clears
   * it back to no bundle-source (the redesign's "Direct" tile). */
  updateBundleProvider: (ownedId: string, bundleProvider: BundleProvider | undefined) => void;
  /** Switches an entry's plan (DetailPanel's "Choose a plan") — writes only
   * the plan fields, leaving kept/access type/bundle/usage/promo intact. */
  updatePlan: (ownedId: string, plan: { planName: string; priceAmount: number; billing: BillingCycle }) => void;
  isOwned: (subscriptionId: string) => boolean;
  getOwned: (subscriptionId: string) => OwnedSubscription | undefined;
  /** Called once on sign-in (see providers.tsx): merges whatever was
   * added anonymously into this account (union; the account's values win
   * on conflict, local-only items are kept), then switches this store to
   * Supabase-backed for as long as userId is set. */
  syncToUser: (userId: string) => Promise<void>;
  /** Re-reads the signed-in account's list — used to drop an optimistic
   * change whose Supabase write failed, so the UI never shows something
   * that isn't actually saved. */
  reloadFromServer: () => Promise<void>;
  /** Called on sign-out — clears to an empty, anonymous, localStorage-only
   * slate rather than leaving the signed-in account's list visible to
   * whoever uses this browser next. */
  clearUser: () => void;
}

function rowToOwned(row: {
  subscription_id: string;
  plan_name: string | null;
  price_monthly: number | null;
  /** Null only on a row from before the price_amount backfill. */
  price_amount?: number | null;
  currency?: string | null;
  billing: string | null;
  next_renewal: string | null;
  added_at: string;
  kept: boolean;
  access_type: string;
  bundle_provider: string | null;
  usage_frequency: string | null;
  promo_end_date: string | null;
}): OwnedSubscription {
  const billing = (row.billing ?? "monthly") as BillingCycle;
  const priceAmount = row.price_amount ?? ownedPriceAmount({ priceMonthly: row.price_monthly ?? 0, billing });
  return {
    ownedId: row.subscription_id,
    subscriptionId: row.subscription_id,
    planName: row.plan_name ?? "",
    priceAmount,
    currency: row.currency ?? "INR",
    priceMonthly: monthlyEquivalent(priceAmount, billing),
    billing,
    nextRenewal: row.next_renewal ?? "",
    addedAt: row.added_at,
    kept: row.kept,
    // Non-nullable in the DB, so this cast is safe for anything that's
    // actually round-tripped through Supabase.
    accessType: row.access_type as AccessType,
    bundleProvider: (row.bundle_provider ?? undefined) as BundleProvider | undefined,
    usageFrequency: (row.usage_frequency ?? undefined) as UsageFrequency | undefined,
    promoEndDate: row.promo_end_date ?? undefined,
  };
}

function ownedToRow(userId: string, o: OwnedSubscription | AddInput) {
  // A legacy local entry (being migrated) may predate priceAmount.
  const priceAmount = "priceMonthly" in o ? ownedPriceAmount(o) : o.priceAmount;
  return {
    user_id: userId,
    subscription_id: o.subscriptionId,
    plan_name: o.planName,
    price_amount: priceAmount,
    currency: ("currency" in o && o.currency) || "INR",
    // Still written (as the monthly equivalent) until the column is
    // dropped in a later change, so a rollback keeps working.
    price_monthly: monthlyEquivalent(priceAmount, o.billing),
    billing: o.billing,
    next_renewal: o.nextRenewal || null,
    kept: o.kept ?? false,
    // Defaults to 'direct' here too — see AddInput.accessType and the
    // DB column's own default; a pre-Sprint-1 localStorage entry being
    // migrated up (syncToUser below) also has no accessType yet, so this
    // fallback is what actually assigns it one on first sync.
    access_type: o.accessType ?? "direct",
    bundle_provider: o.bundleProvider ?? null,
    usage_frequency: o.usageFrequency ?? null,
    promo_end_date: o.promoEndDate ?? null,
    // Only a migrated local entry has an addedAt — keep its real add time
    // instead of the DB stamping the migration time. A fresh add omits it
    // (DB default), and an upsert onto an existing row leaves it alone.
    ...("addedAt" in o && o.addedAt ? { added_at: o.addedAt } : {}),
  };
}

/** The catalogue plan an entry's (free-text) plan name matches, for event
 * props — null when it's a custom name. */
function planIdFor(subscriptionId: string, planName: string): string | null {
  const name = planName.trim().toLowerCase();
  return SUBSCRIPTIONS_BY_ID[subscriptionId]?.plans.find((p) => p.name.toLowerCase() === name)?.name ?? null;
}

/** Defense in depth for the Track Subscriptions sign-in requirement. The UI
 * prompts sign-in at each entry point (AddSubscriptionsModal, requireSignIn),
 * but every mutation is ALSO refused here, at the one place data is
 * actually written — so a path the UI gate misses (or one added later)
 * can't quietly create or change tracked data for a signed-out visitor. */
function requireAccount(action: string): boolean {
  if (useAuthStore.getState().user) return true;
  console.warn(`Track Subscriptions: "${action}" ignored — sign-in required.`);
  return false;
}

let syncInFlight: { userId: string; promise: Promise<void> } | null = null;

export const useMySubscriptionsStore = create<MySubscriptionsState>()(
  persist(
    (set, get) => {
      // A failed write leaves the optimistic local change out of step with
      // the account — re-read the account so the UI reflects what's saved
      // rather than keeping a phantom edit that would vanish on reload.
      function onWriteError(label: string, message: string) {
        console.error(`${label}:`, message);
        void get().reloadFromServer();
      }

      return {
        owned: [],
        hydrated: false,
        userId: null,
        syncFailed: false,
        setHydrated: () => set({ hydrated: true }),

        add: (input) => {
          if (!requireAccount("add")) return;
          const { userId } = get();
          const ownedId = userId ? input.subscriptionId : `${input.subscriptionId}-${Date.now()}`;
          // input.accessType is optional (AddInput); OwnedSubscription
          // requires it — same 'direct' default as the DB column and
          // ownedToRow below.
          const accessType = input.accessType ?? "direct";
          set((state) => ({
            owned: [
              ...state.owned.filter((o) => o.subscriptionId !== input.subscriptionId),
              {
                ownedId,
                addedAt: new Date().toISOString(),
                ...input,
                currency: "INR",
                priceMonthly: monthlyEquivalent(input.priceAmount, input.billing),
                accessType,
              },
            ],
          }));
          trackEvent("subscription_added", {
            service_id: input.subscriptionId,
            plan_id: planIdFor(input.subscriptionId, input.planName),
            price: input.priceAmount,
            billing_cycle: input.billing,
            currency: "INR",
          });
          if (userId) {
            createClient()
              .from("owned_subscriptions")
              .upsert(ownedToRow(userId, input), { onConflict: "user_id,subscription_id" })
              .then(({ error }) => {
                if (error) onWriteError("Failed to save subscription", error.message);
              });
          }
        },

        remove: (ownedId) => {
          if (!requireAccount("remove")) return;
          const { userId, owned } = get();
          const entry = owned.find((o) => o.ownedId === ownedId);
          set((state) => ({ owned: state.owned.filter((o) => o.ownedId !== ownedId) }));
          if (entry) trackEvent("subscription_removed", { service_id: entry.subscriptionId });
          if (userId && entry) {
            createClient()
              .from("owned_subscriptions")
              .delete()
              .eq("user_id", userId)
              .eq("subscription_id", entry.subscriptionId)
              .then(({ error }) => {
                if (error) onWriteError("Failed to remove subscription", error.message);
              });
          }
        },

        toggleKept: (ownedId) => {
          if (!requireAccount("toggleKept")) return;
          const { userId, owned } = get();
          const entry = owned.find((o) => o.ownedId === ownedId);
          const nextKept = entry ? !entry.kept : undefined;
          set((state) => ({
            owned: state.owned.map((o) => (o.ownedId === ownedId ? { ...o, kept: !o.kept } : o)),
          }));
          if (entry) trackEvent("subscription_edited", { service_id: entry.subscriptionId, fields_changed: ["kept"] });
          if (userId && entry && nextKept !== undefined) {
            createClient()
              .from("owned_subscriptions")
              .update({ kept: nextKept })
              .eq("user_id", userId)
              .eq("subscription_id", entry.subscriptionId)
              .then(({ error }) => {
                if (error) onWriteError("Failed to update subscription", error.message);
              });
          }
        },

        updateUsageFrequency: (ownedId, usageFrequency) => {
          if (!requireAccount("updateUsageFrequency")) return;
          const { userId, owned } = get();
          const entry = owned.find((o) => o.ownedId === ownedId);
          set((state) => ({
            owned: state.owned.map((o) => (o.ownedId === ownedId ? { ...o, usageFrequency } : o)),
          }));
          if (entry && entry.usageFrequency !== usageFrequency) {
            trackEvent("subscription_edited", { service_id: entry.subscriptionId, fields_changed: ["usage_frequency"] });
          }
          if (userId && entry) {
            createClient()
              .from("owned_subscriptions")
              .update({ usage_frequency: usageFrequency })
              .eq("user_id", userId)
              .eq("subscription_id", entry.subscriptionId)
              .then(({ error }) => {
                if (error) onWriteError("Failed to update subscription", error.message);
              });
          }
        },

        updateBundleProvider: (ownedId, bundleProvider) => {
          if (!requireAccount("updateBundleProvider")) return;
          const { userId, owned } = get();
          const entry = owned.find((o) => o.ownedId === ownedId);
          set((state) => ({
            owned: state.owned.map((o) => (o.ownedId === ownedId ? { ...o, bundleProvider } : o)),
          }));
          if (entry && entry.bundleProvider !== bundleProvider) {
            trackEvent("subscription_edited", { service_id: entry.subscriptionId, fields_changed: ["bundle_provider"] });
          }
          if (userId && entry) {
            createClient()
              .from("owned_subscriptions")
              .update({ bundle_provider: bundleProvider ?? null })
              .eq("user_id", userId)
              .eq("subscription_id", entry.subscriptionId)
              .then(({ error }) => {
                if (error) onWriteError("Failed to update subscription", error.message);
              });
          }
        },

        updatePlan: (ownedId, plan) => {
          if (!requireAccount("updatePlan")) return;
          const { userId, owned } = get();
          const entry = owned.find((o) => o.ownedId === ownedId);
          if (!entry) return;
          const fieldsChanged = [
            entry.planName !== plan.planName && "plan_name",
            ownedPriceAmount(entry) !== plan.priceAmount && "price",
            entry.billing !== plan.billing && "billing_cycle",
          ].filter((f): f is string => Boolean(f));
          if (fieldsChanged.length === 0) return;
          set((state) => ({
            owned: state.owned.map((o) =>
              o.ownedId === ownedId ? { ...o, ...plan, priceMonthly: monthlyEquivalent(plan.priceAmount, plan.billing) } : o
            ),
          }));
          trackEvent("subscription_edited", { service_id: entry.subscriptionId, fields_changed: fieldsChanged });
          if (userId) {
            createClient()
              .from("owned_subscriptions")
              .update({
                plan_name: plan.planName,
                price_amount: plan.priceAmount,
                price_monthly: monthlyEquivalent(plan.priceAmount, plan.billing),
                billing: plan.billing,
              })
              .eq("user_id", userId)
              .eq("subscription_id", entry.subscriptionId)
              .then(({ error }) => {
                if (error) onWriteError("Failed to update subscription", error.message);
              });
          }
        },

        isOwned: (subscriptionId) => get().owned.some((o) => o.subscriptionId === subscriptionId),
        getOwned: (subscriptionId) => get().owned.find((o) => o.subscriptionId === subscriptionId),

        syncToUser: (userId) => {
          // One sync per user at a time: a re-run of the provider effect
          // (React StrictMode in dev, a fast double auth event) joins the
          // sync already in flight instead of racing it — which would
          // upload twice and double-count anon_subs_migrated.
          if (syncInFlight?.userId === userId) return syncInFlight.promise;
          // Every await below re-checks that this user is still the one
          // signed in: a sync that outlives a sign-out (or a switch to
          // another account) must drop its result, never apply it.
          const stillCurrent = () => useAuthStore.getState().user?.id === userId;
          const promise = (async () => {
            // Anything held for a different, previous account is that
            // account's data, not anonymous items — never migrate it.
            const heldFor = get().userId;
            if (heldFor && heldFor !== userId) set({ owned: [], userId: null, syncFailed: false });

            const supabase = createClient();
            const { data: remoteRows, error } = await supabase.from("owned_subscriptions").select("*").eq("user_id", userId);
            if (!stillCurrent()) return;
            if (error) {
              // Nothing has been touched — the local copy stays intact and
              // the whole sync is retried on the next sign-in/page load.
              console.error("Failed to load subscriptions:", error.message);
              set({ syncFailed: true });
              return;
            }
            const remoteOwned = (remoteRows ?? []).map(rowToOwned);
            const pushed = new Set(remoteOwned.map((o) => o.subscriptionId));
            let migratedCount = 0;

            // Push every local item the account doesn't have yet (the
            // anonymous adds made before sign-in). Local state is re-read on
            // every pass, not snapshotted up front, so anything added while
            // this sync was awaiting the network is picked up too instead of
            // being overwritten below. Items the account already has are
            // never pushed — the account's values win on conflict.
            for (;;) {
              const pendingBySub = new Map<string, OwnedSubscription>();
              for (const o of get().owned) if (!pushed.has(o.subscriptionId)) pendingBySub.set(o.subscriptionId, o);
              const pending = [...pendingBySub.values()];
              if (pending.length === 0) break;

              const { error: migrateError } = await supabase
                .from("owned_subscriptions")
                .upsert(
                  pending.map((o) => ownedToRow(userId, o)),
                  // Rows without an addedAt use the DB default, not null.
                  { onConflict: "user_id,subscription_id", defaultToNull: false }
                );
              if (!stillCurrent()) return;
              if (migrateError) {
                // Abort BEFORE switching to signed-in mode: persist only
                // stops writing the local copy once userId is set, so an
                // un-migrated item is never dropped on a failed upload.
                console.error("Failed to migrate local subscriptions:", migrateError.message);
                set({ syncFailed: true });
                return;
              }
              for (const o of pending) pushed.add(o.subscriptionId);
              migratedCount += pending.length;
            }

            // No await between the last pending check above and this set(),
            // so nothing can slip in unpushed. Setting userId is also what
            // makes persist stop mirroring the account into localStorage —
            // i.e. the local copy is cleared only after a successful merge.
            if (!stillCurrent()) return;
            const remoteIds = new Set(remoteOwned.map((o) => o.subscriptionId));
            set((state) => ({
              owned: [
                ...remoteOwned,
                ...state.owned.filter((o) => !remoteIds.has(o.subscriptionId)).map((o) => ({ ...o, ownedId: o.subscriptionId })),
              ],
              userId,
              syncFailed: false,
            }));
            if (migratedCount > 0) trackEvent("anon_subs_migrated", { count: migratedCount });
          })().finally(() => {
            if (syncInFlight?.promise === promise) syncInFlight = null;
          });
          syncInFlight = { userId, promise };
          return promise;
        },

        reloadFromServer: async () => {
          const { userId } = get();
          if (!userId) return;
          const { data, error } = await createClient().from("owned_subscriptions").select("*").eq("user_id", userId);
          // Signed out or switched account meanwhile — don't resurrect it.
          if (get().userId !== userId || useAuthStore.getState().user?.id !== userId) return;
          if (error) {
            console.error("Failed to reload subscriptions:", error.message);
            return;
          }
          set({ owned: (data ?? []).map(rowToOwned) });
        },

        clearUser: () => set({ owned: [], userId: null, syncFailed: false }),
      };
    },
    {
      name: "submynt-my-subscriptions",
      skipHydration: true,
      // A signed-in account is the source of truth and is never mirrored
      // into localStorage: that mirror would otherwise be mistaken for
      // anonymous data and migrated into whichever account signs in next on
      // a shared browser. Only anonymous (legacy) items are persisted.
      partialize: (state) => ({ owned: state.userId ? [] : state.owned }) as MySubscriptionsState,
    }
  )
);
