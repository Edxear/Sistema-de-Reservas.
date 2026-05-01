# Frontend Deployment Guide (Vercel)

This frontend is configured to run as a full SPA on Vercel, including optional login.

## 1) Recommended Vercel Project Settings

- Framework Preset: `Create React App`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `build`

`vercel.json` already rewrites all routes to `index.html` for SPA navigation.

## 2) Environment Variables

Use these in Vercel Project Settings -> Environment Variables:

- `REACT_APP_DEMO_MODE=true`
  - Enables full navigation without backend.
  - Login/Register are optional and simulated.

For public demo domain behavior:

- On `https://sistema-de-reservas-eta.vercel.app`, app defaults to demo mode even if no localStorage is set.
- `/` redirects to `/demo` when demo is active.
- To unlock real mode on your own computer (same domain), open:
  - `https://sistema-de-reservas-eta.vercel.app/?modo=real`
- To switch back explicitly:
  - `https://sistema-de-reservas-eta.vercel.app/?modo=demo`

Optional for real backend mode:

- `REACT_APP_DEMO_MODE=false`
- `REACT_APP_API_URL=https://your-backend-domain.com`

## 3) Local Verification

```bash
npm install
npm run build
```

Build should complete successfully and generate `frontend/build`.

## 4) Demo Mode Toggle in UI

The header includes a `Modo Demo: ON/OFF` switch:

- `ON`: opens all sections without backend dependency.
- `OFF`: frontend uses real authentication and API endpoints.

The selected mode is stored in localStorage (`demoModeOverride`).

On the public demo domain, turning demo OFF from UI is blocked unless real mode was explicitly unlocked with `?modo=real`.

## 5) Routes

- `/dashboard` is the main entry route.
- `/login` remains available as optional login page.

## 6) Quick Publish Checklist

- Push repository changes.
- Create/import project in Vercel.
- Set root folder to `frontend`.
- Confirm env vars (`REACT_APP_DEMO_MODE=true` for demo).
- Deploy.

## 7) About `fs.F_OK` Deprecation Warning on Vercel

If you see this warning during build:

`[DEP0176] DeprecationWarning: fs.F_OK is deprecated, use fs.constants.F_OK instead`

- It comes from tooling dependencies (not from your app source code).
- It is a warning, not a build failure by itself.
- The build script is configured with `--no-deprecation` to keep logs clean in CI.
