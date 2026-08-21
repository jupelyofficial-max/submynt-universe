# SUBMYNT V2 — Subscription Universe

An interactive discovery canvas for finding, comparing and optimizing digital
subscriptions. Every subscription is a large, recognizable floating logo,
organized into dense clusters by category and popularity rather than any
real-world geography — search, filter, pan, zoom, click through to detail,
compare alternatives, and track savings. Standalone project; separate from
the main Submynt marketing site.

**Live**: https://submynt-universe.vercel.app
**Repo**: https://github.com/jupelyofficial-max/submynt-universe

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** for styling (design tokens in `src/app/globals.css`)
- **React Three Fiber / drei / three.js** for the WebGL world map + nodes
- **Zustand** for UI state (`useUniverseStore`) and persisted local state
  (`useMySubscriptionsStore`, localStorage-backed — no backend, no bank login)
- **Framer Motion** for panel/sheet transitions

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Routes:

| Route | Purpose |
|---|---|
| `/` | Redirects straight to `/explore` — there's no separate landing page |
| `/explore` | The Subscription Universe — search, filter, Universe/List views |
| `/my-subscriptions` | Manually tracked subscriptions |
| `/compare` | Side-by-side comparison (`?ids=a,b,c`) |
| `/optimize` | Spend summary + savings opportunities |

## Architecture notes

- **Data model**: `src/types/subscription.ts` + `src/data/subscriptions.ts`.
  ~130 mock subscriptions (illustrative INR pricing, not live data) built from
  one `Subscription` shape — no component is hard-coded to an individual
  brand. Swapping in a real catalogue/API means replacing `SUBSCRIPTIONS`
  only; everything downstream (nodes, list, compare, optimize) already reads
  the generic shape.
- **Universe canvas**: `src/components/universe/universeCanvasTexture.ts`
  draws the abstract backdrop — a warm cream surface with a faint
  cartographic grid and a few soft radial washes, no real geography. There
  is deliberately nothing to recognize as a "map" here; it's environment,
  not content.
- **Universe layout**: `src/lib/universeLayout.ts` groups subscriptions by
  `category`, fans the categories themselves out from the center in a
  golden-angle spiral (biggest category closest in, so the default view
  opens on the densest, most recognizable cluster), and fans same-category
  services out around their category's center the same way (most popular
  closest to the center). Faint "constellation" links are drawn between
  nearby nodes within the same category cluster. Pure function of the
  catalogue, so it's stable across sessions — positioning does not depend
  on any real-world geography.
- **Logos**: `scripts/fetch-logos.mjs` is a one-time script (not a runtime
  dependency) that fetches each mock subscription's real logo from a public
  favicon service into `public/logos/`, with a manifest at
  `src/data/logoManifest.json`. `SubscriptionLogo.tsx` (2D UI) and
  `src/components/universe/logoTexture.ts` (3D nodes) both render the real
  logo when available, falling back to a canvas-generated colored
  lettermark circle for the handful that don't resolve.
- **Camera**: `CameraController.tsx` is a custom pan/zoom rig (not drei's
  `OrbitControls`) so the canvas behaves like a real map you fly over, not a
  freely-orbiting 3D object. It only moves on deliberate input — drag,
  wheel/pinch zoom, a camera command (reset/focus/search), or "Discover
  mode" — never passively from mouse position, so the background stays
  still while you're just reading the page.
- **State**: `useUniverseStore` holds search/filter/view/selection/camera-
  command state; `useMySubscriptionsStore` persists what the user has added,
  hydrated client-side post-mount to avoid SSR/localStorage mismatches.

## Scripts

```bash
npm run dev     # start dev server (Turbopack)
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint (react-hooks/react-compiler rules included)
```

## Deploying

Standard Next.js app — deploys to Vercel with zero extra config
(`vercel.json` isn't needed; framework is auto-detected). The GitHub repo is
connected to the `submynt-universe` Vercel project, so pushes to `main`
auto-deploy. To deploy manually:

```bash
npx vercel --prod
```
