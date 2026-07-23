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

Form submissions are validated client-side and stored in `localStorage` under `ridgeguard-leads` as a demo. Replace the submit handler in `src/App.tsx` with your CRM or form API endpoint for production.
