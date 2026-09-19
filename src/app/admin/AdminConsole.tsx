"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, ShieldCheck, Users } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { formatDate, formatINR } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { Category } from "@/types/subscription";
import type { AdminUser, AdminUsersResponse } from "@/app/api/admin/users/route";

type SortOrder = "newest" | "oldest";

export function AdminConsole() {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const router = useRouter();
  // Keyed on id, not the whole user object — onAuthStateChange fires a new
  // object reference on plain token refreshes too, which would otherwise
  // re-run this on a schedule that has nothing to do with who's signed in.
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const authHydrated = useAuthStore((s) => s.hydrated);

  // The server-side gate in page.tsx only runs once, at the initial page
  // load — it does nothing for a sign-out (or a switch to a different,
  // non-admin account) that happens while already sitting on this page.
  // Without this, the already-fetched user table just stays rendered in
  // React state indefinitely after the viewer stops being an admin, which
  // is exactly the kind of thing an admin console can't get away with.
  // Re-verifying (not just checking "still signed in") on every identity
  // change, then only fetching the actual data once that passes, covers
  // sign-out, switching accounts, and a session simply expiring.
  useEffect(() => {
    if (!authHydrated) return;
    let cancelled = false;

    (async () => {
      // Ensures every setState below runs from a genuine async callback,
      // not synchronously within the effect body (react-hooks/set-state-in-effect).
      await Promise.resolve();
      if (cancelled) return;

      if (!userId) {
        setData(null);
        router.replace("/explore");
        return;
      }

      try {
        const checkRes = await fetch("/api/admin/check");
        const { isAdmin } = (await checkRes.json()) as { isAdmin: boolean };
        if (cancelled) return;
        if (!isAdmin) {
          setData(null);
          router.replace("/explore");
          return;
        }

        const usersRes = await fetch("/api/admin/users");
        if (!usersRes.ok) {
          const body = await usersRes.json().catch(() => null);
          throw new Error(body?.error ?? `Request failed (${usersRes.status})`);
        }
        const json = (await usersRes.json()) as AdminUsersResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, authHydrated, router]);

  const users = useMemo(() => {
    if (!data) return [];
    let list = data.users;
    if (categoryFilter !== "all") {
      list = list.filter((u) => u.hearts.some((h) => h.category === categoryFilter));
    }
    return [...list].sort((a, b) => {
      const diff = new Date(a.signupDate).getTime() - new Date(b.signupDate).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });
  }, [data, sortOrder, categoryFilter]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:px-8">
      <Link
        href="/explore"
        className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-300 transition-colors hover:bg-black/5 hover:text-ink-0"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ocean-500/15 text-ocean-600">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-0">Admin console</h1>
          <p className="text-sm text-ink-400">All signed-up users and their subscription interests.</p>
        </div>
      </div>

      {error && (
        <div className="glass-panel rounded-2xl p-6 text-sm text-rose-400">Failed to load: {error}</div>
      )}

      {!error && !data && <div className="glass-panel rounded-2xl p-6 text-sm text-ink-400">Loading…</div>}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-500/10 text-ocean-600">
                <Users size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink-0">{data.totalUsers}</div>
                <div className="text-[11px] text-ink-500">Total users</div>
              </div>
            </div>
            <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nebula-500/10 text-nebula-500">
                <Heart size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink-0">{data.totalHearts}</div>
                <div className="text-[11px] text-ink-500">Total hearts</div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="h-9 rounded-lg border border-black/10 bg-void-900/70 px-3 text-xs text-ink-0 outline-none"
            >
              <option value="newest">Newest signups first</option>
              <option value="oldest">Oldest signups first</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category | "all")}
              className="h-9 rounded-lg border border-black/10 bg-void-900/70 px-3 text-xs text-ink-0 outline-none"
            >
              <option value="all">All interest categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <span className="text-xs text-ink-500">
              {users.length} of {data.totalUsers} users
            </span>
          </div>

          <div className="glass-panel overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[960px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-black/10 text-ink-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                  <th className="px-4 py-3 font-medium">Gender</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Signed up</th>
                  <th className="px-4 py-3 font-medium">Hearted subscriptions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow key={u.id} user={u} />
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center text-sm text-ink-500">No users match this filter.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <tr className="border-b border-black/5 align-top last:border-0">
      <td className="px-4 py-3 text-ink-0">{user.name ?? <span className="text-ink-600">—</span>}</td>
      <td className="px-4 py-3 text-ink-300">{user.email ?? <span className="text-ink-600">—</span>}</td>
      <td className="px-4 py-3 text-ink-300">{user.contactNumber ?? <span className="text-ink-600">—</span>}</td>
      <td className="px-4 py-3 text-ink-300">{user.age ?? <span className="text-ink-600">—</span>}</td>
      <td className="px-4 py-3 text-ink-300">{user.gender ?? <span className="text-ink-600">—</span>}</td>
      <td className="px-4 py-3 text-ink-300">{user.location ?? <span className="text-ink-600">—</span>}</td>
      <td className="px-4 py-3 whitespace-nowrap text-ink-300">{formatDate(user.signupDate)}</td>
      <td className="px-4 py-3">
        {user.hearts.length === 0 ? (
          <span className="text-ink-600">—</span>
        ) : (
          <div className="flex max-w-xs flex-wrap gap-1.5">
            {user.hearts.map((h) => (
              <span
                key={h.subscriptionId}
                title={`${h.category} · ${h.planName ?? "—"} · ${h.priceMonthly != null ? formatINR(h.priceMonthly) + "/mo" : "—"}`}
                className="rounded-full bg-black/5 px-2 py-1 text-[11px] text-ink-200"
              >
                {h.name}
              </span>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}
