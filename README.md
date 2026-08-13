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
- **Shared across all your devices** — entries are saved in a **SQLite database on
  your own server**, so both parents' phones, the tablet and the laptop all see the
  same live log. The app polls and refreshes on focus, so new entries show up on the
  other devices within a few seconds. One-tap JSON **export / import** in Settings for
  backups. Everything stays on your network — nothing leaves your server.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), served
  through Next.js API routes (`src/app/api/*`, data layer in `src/lib/db.ts`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database is created
automatically at `./data/baby-tracker.db` (override with the `DB_PATH` env var). On
your phone, open the same URL and use your browser's **Add to Home Screen** option to
install it.

## Build for production

```bash
npm run build
npm run start
```

This runs a small Node server (Next.js standalone) with the SQLite-backed API, so it
needs a persistent place for the database — see Docker below for the recommended way
to run it on a home server.

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `DB_PATH` | `./data/baby-tracker.db` (`/data/baby-tracker.db` in Docker) | SQLite database file location |
| `PORT` | `3000` | HTTP port |
| `TZ` | system | Timezone for the container |
| `PUID` / `PGID` | `1001` / `1001` | User/group the server runs as. The container starts as root, fixes ownership of the `/data` volume, then drops to this user — so a root-owned dataset just works. Set these to match your dataset owner if you prefer. |

## 🐳 Run with Docker

The repo ships a production `Dockerfile` (Next.js standalone output → small Alpine
image) and a `docker-compose.yml`. The SQLite database lives in a mounted volume at
`/data`, so it survives container updates and restarts.

```bash
docker compose up -d --build
# then open http://<host>:3000
```

or without compose (note the volume mount so data persists):

```bash
docker build -t baby-tracker .
docker run -d --name baby-tracker -p 3000:3000 --restart unless-stopped \
  -v baby-tracker-data:/data baby-tracker
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
4. **Storage:** add a **host-path (or dataset) volume** mounted at **`/data`** — point
   it at a dataset like `/mnt/tank/apps/baby-tracker`. This is where the SQLite
   database is kept, so ZFS snapshots and replication back it up automatically. You
   don't need to pre-set permissions — the container starts as root, takes ownership
   of `/data`, then drops to a non-root user. Leave the app's **user/group at the
   default (root)** so it can do this; if the UI pins a non-root uid, either grant that
   uid write access to the dataset or set `PUID`/`PGID` to match it.
5. Deploy, then open `http://<truenas-ip>:30030`.

Compose YAML for the **Install via YAML** flow (edit the host path to a real dataset):

```yaml
services:
  baby-tracker:
    image: ghcr.io/cyb3rr3ap3r/baby-tracker:latest
    restart: unless-stopped
    ports:
      - "30030:3000"
    environment:
      - TZ=America/New_York
      - DB_PATH=/data/baby-tracker.db
    volumes:
      - /mnt/tank/apps/baby-tracker:/data
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

## Data, sharing & backups

- **One shared log.** All entries and settings live in a single SQLite database on the
  server (`/data/baby-tracker.db`). Every device on your network reads and writes the
  same data — log a feed on one phone and it appears on the others within a few seconds.
- **No accounts / no auth.** It's built for a trusted LAN. Don't expose it directly to
  the internet; if you want remote access, put it behind a VPN (e.g. Tailscale /
  WireGuard) or an authenticating reverse proxy.
- **Backups.** The database is a single file in the mounted volume, so ZFS snapshots of
  the dataset cover it. You can also grab a portable **JSON export** any time from
  **Settings → Export**, and **Import** it to restore.

### API

The client talks to a small REST API (handy if you ever want to script imports):

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/state` | Everything (baby, settings, events) |
| `GET` / `POST` | `/api/events` | List / create an event |
| `PATCH` / `DELETE` | `/api/events/:id` | Update / delete an event |
| `PUT` | `/api/settings` | Update units & theme |
| `PUT` | `/api/baby` | Update baby profile |
| `POST` / `DELETE` | `/api/data` | Import (replace all) / clear all entries |
