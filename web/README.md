# Fasting Tracker (web)

A Vite + React + TypeScript progressive web app for tracking fasts. It is installable and works offline after the first visit.

## Development

```bash
npm install
npm run dev       # start the dev server
npm test          # run the unit tests
npm run build     # type-check and build to dist/
npm run preview   # serve the production build locally
```

## Deploy (Vercel or Netlify)

Import the GitHub repo and set:

- **Root Directory:** `web`
- **Build command:** `npm run build`
- **Output directory:** `dist`

## Install on iPhone

Open the deployed site in Safari, tap Share, then **Add to Home Screen**.

## Data

All data is stored on-device in the browser's localStorage, per browser or install. It is not synced between devices.

**Caution:** use the app from the Home Screen icon. Data in a Safari tab is separate from the installed app, and iOS may clear website data after about 7 days of non-use in Safari. Data is local to the device and is not synced.
