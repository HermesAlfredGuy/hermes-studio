#!/usr/bin/env bash
# Cron entry for "Studio site refresh" (no_agent): silent on success, loud on failure.
# no_agent jobs post their stdout verbatim, so printing nothing is how a healthy night stays quiet.
set -uo pipefail
out="$(bash /opt/data/projects/hermes-studio/scripts/refresh.sh 2>&1)"
rc=$?
if [ "$rc" -ne 0 ]; then
  echo "Studio site refresh FAILED (exit $rc)"
  echo "$out" | tail -25
fi
exit "$rc"
