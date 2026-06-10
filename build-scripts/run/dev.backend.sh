#!/usr/bin/env bash
#
# One-command local-dev BACKEND for working on the native frontend.
#
# Brings up a DSpace backend in Docker (matching this FE), loaded with a sample dataset, reachable at
# http://127.0.0.1:8087/server, then indexes Solr so browse/search/"What's New" populate. After it
# prints "Backend ready", start the FE:
#
#     yarn start:dev:local      # ng serve, live-reload, http://localhost:4000  (needs Node 18 — see .nvmrc)
#
# The backend IMAGE is recognised AUTOMATICALLY rather than hardcoded here:
#   * image tags are read from the repo's own compose files (the source of truth, so they can't go
#     stale against a copy in this script), and
#   * after boot the script recognises the running backend's version + flavor and warns if it does
#     not match this FE (the DSpace-7.5 "browse definitions" trap).
#
# FLAVOR selects WHICH backend (override: FLAVOR=clarin ...):
#   upstream  (default) public DSpace demo — DSpace 7.6.x + the official demo dataset (db.entities.yml).
#             Right VERSION for this FE and zero dataquest pull, but UPSTREAM flavor: CLARIN-specific
#             endpoints/config/content are absent (some FE calls 404 — harmless to render).
#   clarin    the version-correct CLARIN/dataquest backend — the image DSpace CI validates
#             (dataquest/dspace:dspace-7_x-test, read from docker/docker-compose-ci.yml) + the CLARIN
#             test dataset (docker/db.clarin.yml). This is the "correct backend" for CLARIN feature
#             work. NOTE: first run pulls ~1-2 GB of dataquest images.
#
# Usage:
#     build-scripts/run/dev.backend.sh                 # up (reuses existing containers/data)
#     build-scripts/run/dev.backend.sh fresh           # wipe DB/Solr volumes first (REQUIRED to switch FLAVOR)
#     FLAVOR=clarin build-scripts/run/dev.backend.sh fresh
#
# Notes:
#   - 127.0.0.1 (not localhost): Node resolves localhost to IPv6 ::1, but the BE binds IPv4 only.
#   - -loadsql images import only into an EMPTY pgdata volume, so always `fresh` when switching FLAVOR.
#
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1

export INSTANCE="${INSTANCE:-7}"
export COMPOSE_PROJECT_NAME="dspace-${INSTANCE}"
export DSPACE_HOST=127.0.0.1
export DSPACE_REST_NAMESPACE=/server
export REST_URL="http://127.0.0.1:808${INSTANCE}/server"
# FE dev-server port; CORS is derived from it so the two can never drift (set UI_PORT to change both).
export UI_PORT="${UI_PORT:-4000}"
export UI_URL="http://localhost:${UI_PORT}"
export HOST_IP=127.0.0.1
export DSPACE_SUBNET_PREFIX="10.10${INSTANCE}"
export REST_CORS_ALLOWED_ORIGINS="http://localhost:${UI_PORT},http://127.0.0.1:${UI_PORT}"
export DSPACE_VER="${DSPACE_VER:-dspace-7_x}"
export DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"

REST_YML=docker/docker-compose-rest.yml
CI_YML=docker/docker-compose-ci.yml
REST="http://127.0.0.1:808${INSTANCE}/server/api"

# Read the default value of a compose `${VAR:-default}` straight from the file (source of truth).
compose_default() { grep -oE "\\\$\\{$1:-[^}]+\\}" "$2" | head -1 | sed -E 's/^.*:-//; s/}$//'; }

# --- recognise WHICH backend image to use (by FLAVOR); tags come FROM THE REPO, not hardcoded here ---
FLAVOR="${FLAVOR:-upstream}"
if [ "$FLAVOR" = "clarin" ]; then
  # Version-correct CLARIN REST image = the default DSpace CI runs against (docker-compose-ci.yml).
  # Deliberately NOT the rest.yml default (dataquest/dspace:dtq-dev-7.5 is DSpace 7.5, which breaks
  # browse-definitions against this 7.6.x FE — see the recognise step below and AGENTS.md Gotcha #6).
  export DSPACE_REST_IMAGE="${DSPACE_REST_IMAGE:-$(compose_default DSPACE_CI_IMAGE "$CI_YML")}"
  export DSPACE_SOLR_IMAGE="${DSPACE_SOLR_IMAGE:-$(compose_default DSPACE_SOLR_IMAGE "$REST_YML")}"
  export DOCKER_OWNER="${DOCKER_OWNER:-dataquest}"
  COMPOSE=(docker compose -f "$REST_YML" -f docker/db.clarin.yml)
else
  # Upstream public demo: right version family (7.6.x) + the official demo dataset (db.entities.yml).
  export DSPACE_REST_IMAGE="${DSPACE_REST_IMAGE:-dspace/dspace:dspace-7_x}"
  export DSPACE_SOLR_IMAGE="${DSPACE_SOLR_IMAGE:-dspace/dspace-solr:dspace-7_x}"
  export DOCKER_OWNER="${DOCKER_OWNER:-dspace}"
  COMPOSE=(docker compose -f "$REST_YML" -f docker/db.entities.yml)
fi
echo ">> FLAVOR=${FLAVOR}   DSPACE_REST_IMAGE=${DSPACE_REST_IMAGE}"

# Recognise the RUNNING backend (whoever/whatever started it) and warn if it won't match this FE.
recognise_backend() {
  local img ver fe browse flavor compat
  img="$(docker inspect "dspace${INSTANCE}" --format '{{.Config.Image}}' 2>/dev/null || true)"
  ver="$(curl -s "$REST" | sed -nE 's/.*"dspaceVersion" *: *"([^"]+)".*/\1/p' | head -1)"
  fe="$(sed -nE 's/.*"version": *"([0-9][^"]*)".*/\1/p' package.json | head -1)"
  browse="$(curl -s -o /dev/null -w '%{http_code}' "$REST/discover/browses" 2>/dev/null)"
  case "$img" in
    dataquest/*) flavor="CLARIN (dataquest)";;
    dspace/*)    flavor="upstream demo (CLARIN endpoints/content ABSENT)";;
    *)           flavor="unknown (${img:-?})";;
  esac
  [ "$browse" = "200" ] && compat="OK" || compat="MISMATCH — looks like a DSpace 7.5 backend"
  echo "------------------------------------------------------------------"
  echo " Backend recognised:"
  echo "   image    : ${img:-?}"
  echo "   version  : ${ver:-?}    (this FE is ${fe:-7.6.x})"
  echo "   flavor   : ${flavor}"
  echo "   browse-definitions canary : HTTP ${browse}  (${compat})"
  case "$ver" in
    'DSpace 7.6'*|'DSpace 7.7'*|'DSpace 8'*) ;;
    *) echo "   !! BE version may not match the FE; if the canary is not 200, use a 7.6.x image." >&2;;
  esac
  if [ "$FLAVOR" != "clarin" ] && [ "${img#dspace/}" != "$img" ]; then
    echo "   note: for the CORRECT CLARIN backend (CLARIN endpoints + content) run:"
    echo "           FLAVOR=clarin $0 fresh"
  fi
  echo "------------------------------------------------------------------"
}

if [ "${1:-}" = "fresh" ]; then
  echo ">> wiping previous dev backend (down -v)"
  "${COMPOSE[@]}" down -v --remove-orphans || true
fi

echo ">> starting backend (project ${COMPOSE_PROJECT_NAME}, flavor ${FLAVOR})"
if ! "${COMPOSE[@]}" up -d; then
  echo "!! 'up' failed. If it's a Postgres version/volume mismatch, run: $0 fresh" >&2
  exit 1
fi

echo -n ">> waiting for REST API (${REST}) "
for _ in $(seq 1 90); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$REST" 2>/dev/null)" = "200" ] && { echo " ready"; break; }
  printf '.'; sleep 5
done
if [ "$(curl -s -o /dev/null -w '%{http_code}' "$REST" 2>/dev/null)" != "200" ]; then
  echo " timed out. Check: ${COMPOSE[*]} logs dspace${INSTANCE}" >&2
  exit 1
fi

echo ">> indexing Solr discovery (so browse/search/What's New populate)"
# MSYS_NO_PATHCONV stops Git Bash from rewriting /dspace/... into a Windows path.
MSYS_NO_PATHCONV=1 docker exec "dspace${INSTANCE}" /dspace/bin/dspace index-discovery -b \
  || echo "   (reindex failed — rerun: MSYS_NO_PATHCONV=1 docker exec dspace${INSTANCE} /dspace/bin/dspace index-discovery -b)"

recognise_backend

cat <<MSG

==================================================================
 Backend ready:  ${REST%/api}     (flavor: ${FLAVOR})
 Start the FE :  yarn start:dev:local      (Node 18 — see .nvmrc)
 Then open    :  ${UI_URL}/
 Stop / wipe  :  ${COMPOSE[*]} down -v
==================================================================
MSG
