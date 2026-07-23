# MacKnight Safety Solutions — Sales Prospecting

Internal tool for the MacKnight sales team to find jobsites that likely need safety staffing and initiate outbound conversations.

## Auth

- Password login for team members
- Forgot / reset password flow
- Forced password change on first login / after admin reset
- Admin console for `smonroe@macknightsafety.com`

### Seeded admin

On first server start:

- **Email:** `smonroe@macknightsafety.com`
- **Temporary password:** `MacknightAdmin!2026`
- You will be required to set a new password before using the app

### Admin capabilities (`/admin`)

- Create sales/admin users
- Generate password reset links (emailed when SMTP is configured)
- Set temporary passwords
- Enable / disable accounts
- Promote / demote roles (primary admin protected)

## Run locally

```bash
npm install
npm run dev
```

- Web: `http://localhost:5173` (proxies `/api` to the server)
- API / production-style serve: `http://localhost:8787`

## Production

```bash
npm run build
npm start
```

Set environment variables:

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default `8787`) |
| `JWT_SECRET` | Session signing secret (**required in production**) |
| `APP_ORIGIN` | Public site URL used in reset links |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Optional email delivery for resets |

Without SMTP, forgot-password and admin “Reset link” still work and return/show the reset URL so access can be restored.

User data is stored in `data/users.json` (gitignored). Persist that directory on your host.

## Prospecting features

1. Territory search — city + mileage or state + mileage
2. Need ranking — jobsites sorted by safety-staffing need probability
3. Decision makers — primary outreach target + contact details
4. Sales actions — talk track, copy contact, local pipeline notes

Demo prospects: `src/data/prospects.ts` · scoring: `src/lib/geo.ts`
