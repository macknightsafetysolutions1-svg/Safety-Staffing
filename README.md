# Ridgeguard Safety Staffing

Lead generation site for a safety staffing company that places certified safety professionals on industrial and construction jobsites.

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

## Lead capture

Inbound staffing requests are validated client-side and stored in `localStorage` under `ridgeguard-leads` as a demo. Replace the submit handler in `src/App.tsx` with your CRM or form API endpoint for production.

## Territory lead generator

The **Find sites** tool (`#finder`) lets reps define a territory by:

- **City + mileage** or **State + mileage**
- Ranking matching jobsites by **need probability** (phase, crew size, missing safety staff, incidents, permits, industry risk)
- Surfacing the **likely decision maker** (highest decision-confidence stakeholder) with contact details when available

Demo prospect data lives in `src/data/prospects.ts`. Scoring and geofencing are in `src/lib/geo.ts`. Swap the corpus for live permit / OSHA / CRM feeds when ready.
