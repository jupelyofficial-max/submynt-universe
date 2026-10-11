import { redirect } from "next/navigation";

// Keeps the query string (utm_* / ref) so first-touch attribution survives
// the hop from submynt.com/?utm_source=… to /explore.
export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, v);
  }
  const qs = query.toString();
  redirect(qs ? `/explore?${qs}` : "/explore");
}
