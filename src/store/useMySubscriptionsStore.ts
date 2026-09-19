import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BillingCycle, OwnedSubscription } from "@/types/subscription";
import { createClient } from "@/lib/supabase/client";

interface AddInput {
  subscriptionId: string;
  planName: string;
  priceMonthly: number;
  billing: BillingCycle;
  nextRenewal: string;
  /** Set true when this add is triggered by the top-of-panel Heart button
   * on a not-yet-owned subscription, so "keep" and "add" happen as one
   * action instead of a dead click. */
  kept?: boolean;
}

interface MySubscriptionsState {
  owned: OwnedSubscription[];
  hydrated: boolean;
  /** Set once signed in — from here on, add/remove/toggleKept also write
   * through to Supabase's owned_subscriptions table, RLS-scoped to this
   * id, instead of staying localStorage-only. */
  userId: string | null;
  setHydrated: () => void;
  add: (input: AddInput) => void;
  remove: (ownedId: string) => void;
  toggleKept: (ownedId: string) => void;
  isOwned: (subscriptionId: string) => boolean;
  getOwned: (subscriptionId: string) => OwnedSubscription | undefined;
  /** Called once on sign-in (see providers.tsx): migrates whatever was
   * added anonymously into this account, then switches this store to
   * Supabase-backed for as long as userId is set. */
  syncToUser: (userId: string) => Promise<void>;
  /** Called on sign-out — clears to an empty, anonymous, localStorage-only
   * slate rather than leaving the signed-in account's list visible to
   * whoever uses this browser next. */
  clearUser: () => void;
}

function rowToOwned(row: {
  subscription_id: string;
  plan_name: string | null;
  price_monthly: number | null;
  billing: string | null;
  next_renewal: string | null;
  added_at: string;
  kept: boolean;
}): OwnedSubscription {
  return {
    ownedId: row.subscription_id,
    subscriptionId: row.subscription_id,
    planName: row.plan_name ?? "",
    priceMonthly: row.price_monthly ?? 0,
    billing: (row.billing ?? "monthly") as BillingCycle,
    nextRenewal: row.next_renewal ?? "",
    addedAt: row.added_at,
    kept: row.kept,
  };
}

function ownedToRow(userId: string, o: OwnedSubscription | AddInput) {
  return {
    user_id: userId,
    subscription_id: o.subscriptionId,
    plan_name: o.planName,
    price_monthly: o.priceMonthly,
    billing: o.billing,
    next_renewal: o.nextRenewal || null,
    kept: o.kept ?? false,
  };
}

export const useMySubscriptionsStore = create<MySubscriptionsState>()(
  persist(
    (set, get) => ({
      owned: [],
      hydrated: false,
      userId: null,
      setHydrated: () => set({ hydrated: true }),

      add: (input) => {
        const { userId } = get();
        const ownedId = userId ? input.subscriptionId : `${input.subscriptionId}-${Date.now()}`;
        set((state) => ({
          owned: [
            ...state.owned.filter((o) => o.subscriptionId !== input.subscriptionId),
            { ownedId, addedAt: new Date().toISOString(), ...input },
          ],
        }));
        if (userId) {
          createClient()
            .from("owned_subscriptions")
            .upsert(ownedToRow(userId, input), { onConflict: "user_id,subscription_id" })
            .then(({ error }) => {
              if (error) console.error("Failed to save subscription:", error.message);
            });
        }
      },

      remove: (ownedId) => {
        const { userId, owned } = get();
        const entry = owned.find((o) => o.ownedId === ownedId);
        set((state) => ({ owned: state.owned.filter((o) => o.ownedId !== ownedId) }));
        if (userId && entry) {
          createClient()
            .from("owned_subscriptions")
            .delete()
            .eq("user_id", userId)
            .eq("subscription_id", entry.subscriptionId)
            .then(({ error }) => {
              if (error) console.error("Failed to remove subscription:", error.message);
            });
        }
      },

      toggleKept: (ownedId) => {
        const { userId, owned } = get();
        const entry = owned.find((o) => o.ownedId === ownedId);
        const nextKept = entry ? !entry.kept : undefined;
        set((state) => ({
          owned: state.owned.map((o) => (o.ownedId === ownedId ? { ...o, kept: !o.kept } : o)),
        }));
        if (userId && entry && nextKept !== undefined) {
          createClient()
            .from("owned_subscriptions")
            .update({ kept: nextKept })
            .eq("user_id", userId)
            .eq("subscription_id", entry.subscriptionId)
            .then(({ error }) => {
              if (error) console.error("Failed to update subscription:", error.message);
            });
        }
      },

      isOwned: (subscriptionId) => get().owned.some((o) => o.subscriptionId === subscriptionId),
      getOwned: (subscriptionId) => get().owned.find((o) => o.subscriptionId === subscriptionId),

      syncToUser: async (userId) => {
        const supabase = createClient();
        const localOwned = get().owned;
        const { data: remoteRows, error } = await supabase.from("owned_subscriptions").select("*").eq("user_id", userId);
        if (error) {
          console.error("Failed to load subscriptions:", error.message);
          return;
        }
        const remoteOwned = (remoteRows ?? []).map(rowToOwned);
        const remoteIds = new Set(remoteOwned.map((o) => o.subscriptionId));

        // Anonymous adds made before this sign-in — migrate them up instead
        // of silently dropping them now that there's an account to attach
        // them to.
        const toMigrate = localOwned.filter((o) => !remoteIds.has(o.subscriptionId));
        if (toMigrate.length > 0) {
          const { error: migrateError } = await supabase
            .from("owned_subscriptions")
            .upsert(
              toMigrate.map((o) => ownedToRow(userId, o)),
              { onConflict: "user_id,subscription_id" }
            );
          if (migrateError) console.error("Failed to migrate local subscriptions:", migrateError.message);
        }

        set({
          owned: [...remoteOwned, ...toMigrate.map((o) => ({ ...o, ownedId: o.subscriptionId }))],
          userId,
        });
      },

      clearUser: () => set({ owned: [], userId: null }),
    }),
    {
      name: "submynt-my-subscriptions",
      skipHydration: true,
      partialize: (state) => ({ owned: state.owned }) as MySubscriptionsState,
    }
  )
);
