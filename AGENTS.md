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
- Two core flows to exercise end to end: the territory prospecting tool (`#finder`) and the "Log a lead" form (`#request`). Submitted leads are stored in `localStorage` under the key `macknight-leads` (no server persistence).
- Demo prospect corpus is in `src/data/prospects.ts`; scoring/geofencing logic is in `src/lib/geo.ts`. Swap these for live feeds in production.
