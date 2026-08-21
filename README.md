# SUBMYNT V2 — Subscription Universe

An interactive "telescope" for discovering, comparing and optimizing digital
subscriptions. Every subscription is a floating logo in a living 3D universe —
search, filter, pan, zoom, click through to detail, compare alternatives, and
track savings. Built as a standalone prototype; it does not touch the existing
Submynt marketing site (`../frontend`).

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** for styling (design tokens in `src/app/globals.css`)
- **React Three Fiber / drei / three.js** for the WebGL universe
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
| `/` | Landing page, ambient universe preview, intro CTAs |
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
- **Universe layout**: `src/lib/universeLayout.ts` deterministically places
  each subscription in 3D space (category → sector, popularity → distance
  from center) and derives faint "constellation" links between related
  nodes. Pure function of the catalogue, so it's stable across sessions.
- **Logos**: subscriptions render as canvas-generated lettermark circles
  (`src/components/universe/logoTexture.ts`) rather than fetched brand
  assets — no external logo licensing/availability concerns, still reads as
  "every subscription is a circular floating logo."
- **Camera**: `CameraController.tsx` is a custom pan/zoom/parallax rig (not
  drei's `OrbitControls`) so the universe behaves like a 2.5D map you fly
  over, not a freely-orbiting 3D object.
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

Standard Next.js app — deploys to Vercel with zero extra config. If deployed
under the same Vercel project as the existing site, point it at this
directory (`universe/`) as the project root.
