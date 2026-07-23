# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **Vite + React 19 + TypeScript** SPA (package manager: **npm**). It is an internal-facing prospecting/lead tool for the MacKnight Safety Solutions team — there is no backend, database, or auth. All data is static demo data plus browser `localStorage`.

### Where the app lives
- The `main` branch is a stub (only `README.md`). The actual application lives on the feature branch (`cursor/safety-staffing-lead-site-d629`). If a checkout only shows `README.md`, you are on `main` and need the feature branch. The update script guards for a missing `package.json` so it is safe on either branch.

### Running / building / testing
Standard scripts are in `package.json`:
- Dev server: `npm run dev` (Vite, serves on `http://localhost:5173`).
- Lint: `npm run lint` (oxlint; config in `.oxlintrc.json`).
- Build: `npm run build` (`tsc -b && vite build`).
- Preview built output: `npm run preview`.

There is **no test framework** configured — there is no `npm test`. Validate changes via lint, build, and manual browser testing.

### Non-obvious notes
- The app is a focused two-tab tool with lightweight hash routing (`#/search`, `#/contacted`) in `src/App.tsx` — there is no router library. Add routes by extending the `Route` type and `parseHash`.
- Core flow: search prospects → "Mark as contacted" → the Contacted page (`#/contacted`) where dated notes can be added per prospect. Contacted prospects and their notes persist in `localStorage` under the key `macknight-contacted` (no server persistence). The store hook is `useContacted` in `src/lib/contacted.ts`.
- Demo prospect corpus is in `src/data/prospects.ts`; scoring/geofencing logic is in `src/lib/geo.ts`. Swap these for live feeds in production.
