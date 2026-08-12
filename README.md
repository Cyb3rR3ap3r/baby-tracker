# 🍼 Little Log — Baby Tracker

A clean, modern web app for tracking your baby's daily stats — diapers, feedings,
sleep, pumping, solids, growth and more. Built mobile-first so it's fast and pleasant
to use one-handed on a phone, and it looks just as good on a laptop.

![Little Log](public/icon.svg)

## Features

- **Fast logging** — tap the ➕ button and record an entry in seconds with simple
  forms, steppers and dropdowns. Everything is tuned for quick, one-handed use.
- **Track everything that matters:**
  - 🧷 Diapers (wet / dirty / both / dry)
  - 🤱 Nursing (side + duration)
  - 🍼 Bottle feeds (amount + contents)
  - 💧 Pumping (side + amount + duration)
  - 😴 Sleep (with "still sleeping" tracking)
  - 🥣 Solids
  - 📏 Growth (weight, length, head circumference)
  - 🌡️ Temperature
  - 💊 Medications
  - 📝 Notes
- **Dashboard** — "time since last feed / diaper / sleep", today's totals at a glance,
  and a live timeline of the day.
- **History** — every entry grouped by day with per-type filters. Tap any entry to
  edit or delete it.
- **Stats** — daily averages plus 7 / 14 / 30-day trend charts for diapers, feeds,
  sleep and bottle intake.
- **Units your way** — ml/oz, kg/lb, cm/in, °C/°F.
- **Light & dark themes** (auto, light or dark).
- **Installable PWA** — "Add to Home Screen" on your phone for an app-like experience.
- **Private by default** — all data is stored locally on your device
  (`localStorage`). Nothing is sent to any server. Back up or move devices with
  one-tap JSON **export / import** in Settings.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19
- TypeScript
- Tailwind CSS v4

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On your phone, open the same URL
and use your browser's **Add to Home Screen** option to install it.

## Build for production

```bash
npm run build
npm run start
```

The app is fully static/client-rendered and deploys anywhere that hosts a Next.js app
(e.g. Vercel, Netlify).

## 🐳 Run with Docker

The repo ships a production `Dockerfile` (Next.js standalone output → small image)
and a `docker-compose.yml`.

```bash
docker compose up -d --build
# then open http://<host>:3000
```

or without compose:

```bash
docker build -t baby-tracker .
docker run -d --name baby-tracker -p 3000:3000 --restart unless-stopped baby-tracker
```

## 🗄️ Deploy on TrueNAS SCALE

Pick whichever matches how you like to manage your NAS.

### Option A — Custom App from a prebuilt image (recommended, no CLI)

TrueNAS's app installer needs a container **image**, not a Dockerfile. The included
GitHub Actions workflow (`.github/workflows/docker-publish.yml`) builds one and
publishes it to `ghcr.io` on every push to `main` (and on `v*` tags). After the first
run your image is at:

```
ghcr.io/cyb3rr3ap3r/baby-tracker:latest
```

Then in TrueNAS:

1. **Apps → Discover Apps → Custom App** (on Electric Eel 24.10+ you can instead use
   **Install via YAML** and paste the compose below).
2. **Image repository:** `ghcr.io/cyb3rr3ap3r/baby-tracker`  **Tag:** `latest`
   *(if your GitHub package is private, add your GHCR username + a
   [personal access token](https://github.com/settings/tokens) with `read:packages`
   under the registry-auth section).*
3. **Port forwarding:** container port `3000` → a node port such as `30030`
   (TrueNAS restricts host ports to 9000+ by default).
4. Deploy, then open `http://<truenas-ip>:30030`.

Compose YAML for the **Install via YAML** flow:

```yaml
services:
  baby-tracker:
    image: ghcr.io/cyb3rr3ap3r/baby-tracker:latest
    restart: unless-stopped
    ports:
      - "30030:3000"
    environment:
      - TZ=America/New_York
```

### Option B — Docker Compose over SSH

If you have SSH / shell access to the NAS (TrueNAS 24.10+ ships Docker + compose):

```bash
git clone https://github.com/Cyb3rR3ap3r/baby-tracker.git
cd baby-tracker
docker compose up -d --build
```

Edit the `ports:` mapping in `docker-compose.yml` first if `3000` is in use, and set
`TZ` to your timezone.

### Putting it behind a nice URL / HTTPS

Point a reverse proxy (Traefik, Nginx Proxy Manager, or the built-in TrueNAS proxy)
at the container's port to get something like `https://baby.home.lan`. The app is a
standard HTTP service, so any proxy works.

> **Heads-up on data & multiple devices.** Right now every entry is stored in the
> **browser** that created it (`localStorage`), so hosting the app on your NAS gives
> you a single always-on URL, but each phone/browser still keeps its *own* log — the
> server doesn't hold the data. To have both parents' phones share one live log,
> the app needs a small backend + database on the server (easy to add — see below).

## A note on data & sync

Data lives on the device it was entered on. To share between two phones (e.g. both
parents), use **Settings → Export** on one device and **Import** on the other. A
future version could add optional cloud sync with accounts — the data layer in
`src/lib/store.tsx` is isolated to make that swap straightforward.
