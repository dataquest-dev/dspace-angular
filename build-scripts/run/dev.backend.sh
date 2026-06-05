#!/usr/bin/env bash
#
# One-command local-dev BACKEND for working on the native frontend.
#
# Brings up a DSpace 7.6.5 backend (matching this FE's version) in Docker, loaded with the
# official demo entities dataset, reachable at http://127.0.0.1:8087/server, then indexes Solr
# so browse/search/"What's New" are populated. After it prints "Backend ready", start the FE:
#
#     yarn start:dev:local      # ng serve, live-reload, http://localhost:4000  (needs Node 18 — see .nvmrc)
#
# Usage:
#     build-scripts/run/dev.backend.sh           # up (reuses existing containers/data)
#     build-scripts/run/dev.backend.sh fresh     # wipe DB/Solr volumes first, then up (clean slate)
#
# Notes:
#   - 127.0.0.1 (not localhost): Node resolves localhost to IPv6 ::1, but the BE binds IPv4 only.
#   - Demo data is UPSTREAM DSpace (not CLARIN), so some CLARIN-specific FE calls 404 — harmless.
#     For CLARIN content, point DSPACE_REST_IMAGE at dataquest/dspace:dspace-7_x and restore a
#     dataquest/LINDAT DB dump instead of using db.entities.yml.
#
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1

export INSTANCE="${INSTANCE:-7}"
export COMPOSE_PROJECT_NAME="dspace-${INSTANCE}"
export DSPACE_HOST=127.0.0.1
export DSPACE_REST_NAMESPACE=/server
export REST_URL="http://127.0.0.1:808${INSTANCE}/server"
export UI_URL="http://localhost:4000"
export HOST_IP=127.0.0.1
export DSPACE_SUBNET_PREFIX="10.10${INSTANCE}"
export REST_CORS_ALLOWED_ORIGINS="http://localhost:4000,http://127.0.0.1:4000"
# DSpace 7.6.5 to match the FE; upstream images + the demo entities dataset (db.entities.yml).
export DSPACE_REST_IMAGE=dspace/dspace:dspace-7_x
export DSPACE_DB_IMAGE=dspace/dspace-postgres-pgcrypto:dspace-7_x
export DSPACE_SOLR_IMAGE=dspace/dspace-solr:dspace-7_x
export DOCKER_REGISTRY=docker.io DOCKER_OWNER=dspace DSPACE_VER=dspace-7_x

COMPOSE=(docker compose -f docker/docker-compose-rest.yml -f docker/db.entities.yml)
REST="http://127.0.0.1:808${INSTANCE}/server/api"

if [ "${1:-}" = "fresh" ]; then
  echo ">> wiping previous dev backend (down -v)"
  "${COMPOSE[@]}" down -v --remove-orphans || true
fi

echo ">> starting backend: DSpace 7.6.5 + demo entities (project ${COMPOSE_PROJECT_NAME})"
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

cat <<MSG

==================================================================
 Backend ready:  ${REST%/api}     (DSpace 7.6.5, demo content)
 Start the FE :  yarn start:dev:local      (Node 18 — see .nvmrc)
 Then open    :  http://localhost:4000/
 Stop / wipe  :  ${COMPOSE[*]} down -v
==================================================================
MSG
