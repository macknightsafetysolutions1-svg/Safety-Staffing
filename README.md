# MacKnight Safety Solutions — Internal Prospecting Console

Internal-facing tool for the MacKnight Safety Solutions business development team. It helps reps find high-need industrial and construction jobsites, identify likely decision makers, and log leads into the pipeline. This is **not** a customer-facing marketing site.

## Stack

- Vite + React + TypeScript
- Pure CSS (no UI framework)

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Territory prospecting

The **Find sites** tool (`#finder`) lets reps define a territory by:

- **City + mileage** or **State + mileage**
- Ranking matching jobsites by **need probability** (phase, crew size, missing safety staff, incidents, permits, industry risk)
- Surfacing the **likely decision maker** (highest decision-confidence stakeholder) with contact details when available

Demo prospect data lives in `src/data/prospects.ts`. Scoring and geofencing are in `src/lib/geo.ts`. Swap the corpus for live permit / OSHA / CRM feeds when ready.

## Lead logging

Reps log prospects via the **Log a lead** form (`#request`). Entries are validated client-side and stored in `localStorage` under `macknight-leads` as a demo. Replace the submit handler in `src/App.tsx` with your CRM or pipeline API endpoint for production.
