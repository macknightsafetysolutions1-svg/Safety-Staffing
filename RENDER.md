# Deploy on Render (beginner checklist)

If the site shows **“APPLICATION LOADING / SERVICE WAKING UP”** in a loop, the service is starting then failing. Use this checklist.

## Correct Render settings

1. **Repository:** `Safety-Staffing`
2. **Branch:** `main` (or `cursor/safety-staffing-lead-site-d629` if main is empty)
3. **Runtime:** Node
4. **Build command:** `npm install && npm run build`
5. **Start command:** `npm start`
6. **Health check path:** `/api/health`  ← important

## Environment variables

Add these in Render → Environment:

| Key | Value |
|---|---|
| `JWT_SECRET` | any long secret phrase only you know |
| `APP_ORIGIN` | your live Render URL, e.g. `https://macknight-prospecting.onrender.com` (no trailing slash) |

You do **not** need to set `PORT` (Render sets it automatically).

## After changing settings

1. Click **Manual Deploy** → **Deploy latest commit**
2. Open the **Logs** tab
3. You should see lines like:
   - `Admin account ready` or `Seeded admin`
   - `MacKnight prospecting API on http://0.0.0.0:...`
4. Visit `/api/health` — it should say `{"ok":true}`
5. Then open the home page and sign in

## Free plan note

On Render free, the app sleeps when idle. The **first** visit can take about a minute. That is normal. A loop that never finishes usually means the health check path is wrong or the start command failed — check Logs.
