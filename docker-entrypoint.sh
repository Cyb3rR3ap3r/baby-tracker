#!/bin/sh
set -e

# Resolve the data directory from DB_PATH (defaults to /data/baby-tracker.db).
DB_FILE="${DB_PATH:-/data/baby-tracker.db}"
DB_DIR="$(dirname "$DB_FILE")"

# Desired runtime user/group. Override PUID/PGID to match the owner of the
# host dataset you mounted at /data (handy on TrueNAS / Unraid).
PUID="${PUID:-1001}"
PGID="${PGID:-1001}"

mkdir -p "$DB_DIR" 2>/dev/null || true

if [ "$(id -u)" = "0" ]; then
  # Running as root: take ownership of the data dir so the app can write its
  # database, then drop privileges to PUID:PGID for the actual server process.
  chown -R "$PUID:$PGID" "$DB_DIR" 2>/dev/null || \
    echo "warn: could not chown $DB_DIR (continuing)"
  exec su-exec "$PUID:$PGID" "$@"
fi

# Already non-root (e.g. the platform pinned a uid). We can't chown, so just
# make sure the directory is writable and give a clear message if it isn't.
if [ ! -w "$DB_DIR" ]; then
  echo "error: $DB_DIR is not writable by uid $(id -u)."
  echo "       Fix the dataset permissions, or run the container as root so it"
  echo "       can adjust them (optionally set PUID/PGID to your dataset owner)."
fi
exec "$@"
