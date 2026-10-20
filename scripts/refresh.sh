#!/usr/bin/env bash
# "Studio site refresh" — keep hermes-studio's work list current, without touching a good build.
#
# Regenerates src/work.json from /opt/data/projects/REGISTRY.json (+ the gallery thumbnails) and
# republishes ONLY if that changed. A registry with nothing new costs one node run and no deploy.
#
# Exit 0 = nothing to do, or published. Non-zero = a real failure (the cron delivers it to General).
set -euo pipefail
export HOME="${HOME:-/opt/data}"
cd /opt/data/projects/hermes-studio

echo "[refresh] $(date -u +%FT%TZ) gen-work"
node scripts/gen-work.mjs

# Anything the generator writes counts: the data file, the copied thumbnails, the generated page.
changed="$(git status --porcelain -- src/work.json public/media/work dist 2>/dev/null | grep -v '^?? dist/' || true)"
if [ -z "$changed" ]; then
  echo "[refresh] src/work.json unchanged — no new projects, nothing to publish"
  exit 0
fi

echo "[refresh] work list changed:"
echo "$changed"
echo "[refresh] building + publishing"
npm run build
COMMIT_MSG="studio: work list refresh from the registry" \
  bash /opt/data/scripts/publish-pages.sh /opt/data/projects/hermes-studio hermes-studio 2>&1 | tail -3

# Prove the deploy landed rather than trusting the script's exit code.
code="$(curl -s -o /dev/null -w '%{http_code}' "https://hermesalfredguy.github.io/hermes-studio/?cb=$RANDOM")"
echo "[refresh] live status $code"
[ "$code" = "200" ] || { echo "[refresh] FAIL: live site did not return 200"; exit 1; }
echo "[refresh] done"
