# MacKnight Safety Solutions — Sales Prospecting

Internal tool for the MacKnight sales team to find jobsites that likely need safety staffing services and initiate outbound conversations.

## What it does

1. **Territory search** — City + mileage or State + mileage
2. **Need ranking** — Jobsites sorted by probability they need SSO / HSE / safety coordinator coverage
3. **Decision makers** — Primary outreach target with confidence score, email/phone when available
4. **Sales actions** — Copy email/phone, copy talk track, track pipeline status + notes (saved in browser `localStorage`)

## Stack

- Vite + React + TypeScript
- Pure CSS

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

## Data

Demo prospects live in `src/data/prospects.ts`. Scoring and geofencing are in `src/lib/geo.ts`. Replace with live permit / OSHA / CRM feeds for production use.

Pipeline status is stored locally under `macknight-prospect-pipeline`.
