#!/bin/bash
if [[ "x$ENVFILE" == "x" ]]; then
    export ENVFILE=$(pwd)/envs/.default
    echo "Using default envfile"
fi

PROJECT=${1:-unnamed_dspace}

echo "Using envfile: [$ENVFILE] for project: [$PROJECT]"

# Preserve passwords if they're already set - they take precedence over env file
SAVED_ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
SAVED_USER_PASSWORD="${USER_PASSWORD:-}"

# Debug: show what we're preserving
echo "DEBUG: Preserving ADMIN_PASSWORD: $(if [[ -n "$SAVED_ADMIN_PASSWORD" ]]; then echo 'yes'; else echo 'NO'; fi)"
echo "DEBUG: Preserving USER_PASSWORD: $(if [[ -n "$SAVED_USER_PASSWORD" ]]; then echo 'yes'; else echo 'NO'; fi)"

# Source env file while preventing password override
# set -a: automatically export all variables set from now on
set -a
source $ENVFILE
# set +a: disable automatic export (back to normal behavior)
set +a

# Restore passwords - they take precedence over env file values
if [[ -n "$SAVED_ADMIN_PASSWORD" ]]; then
    export ADMIN_PASSWORD="$SAVED_ADMIN_PASSWORD"
fi
if [[ -n "$SAVED_USER_PASSWORD" ]]; then
    export USER_PASSWORD="$SAVED_USER_PASSWORD"
fi

# Debug output to verify passwords are set after restoration
echo "DEBUG: After restore - ADMIN_PASSWORD is $(if [[ -n "$ADMIN_PASSWORD" ]]; then echo 'set'; else echo 'NOT set'; fi)"
echo "DEBUG: After restore - USER_PASSWORD is $(if [[ -n "$USER_PASSWORD" ]]; then echo 'set'; else echo 'NOT set'; fi)"

# docker-compose does not pull those that have `build` section?!
echo "====="
docker pull $DSPACE_UI_IMAGE

pushd ../..
echo "====="
docker compose --env-file $ENVFILE -f docker/docker-compose.yml -f docker/docker-compose-rest.yml pull
docker compose --env-file $ENVFILE -p $PROJECT -f docker/docker-compose.yml -f docker/docker-compose-rest.yml up -d --no-build
popd

# Create admin user
# set DOCKER_OWNER to match our image (see cli.yml)
pushd ../..
echo "====="
#docker compose --env-file $ENVFILE -p $PROJECT -f docker/matomo-w-db.yml pull
#docker compose --env-file $ENVFILE -p $PROJECT -f docker/matomo-w-db.yml up -d --no-build

# docker-compose-rest.yml must be last, since it specifies network in more detail. If it is not last, there is "root must be a mapping" error.
if [[ -z "$ADMIN_PASSWORD" ]]; then
    echo "ERROR: ADMIN_PASSWORD is required but not set." >&2
    exit 1
fi
if [[ -z "$USER_PASSWORD" ]]; then
    echo "ERROR: USER_PASSWORD is required but not set." >&2
    exit 1
fi
docker compose --env-file $ENVFILE -p $PROJECT -f docker/docker-compose.yml -f docker/cli.yml -f docker/docker-compose-rest.yml run --rm dspace-cli create-administrator -e dspace.admin.dev@dataquest.sk -f admin -l user -p "${ADMIN_PASSWORD}" -c en -o dataquest
docker compose --env-file $ENVFILE -p $PROJECT -f docker/docker-compose.yml -f docker/cli.yml -f docker/docker-compose-rest.yml run --rm dspace-cli user --add -m dspace.user.dev@dataquest.sk -g meno -s priezvisko -l en -p "${USER_PASSWORD}" -o dataquest
docker compose --env-file $ENVFILE -p $PROJECT -f docker/docker-compose.yml -f docker/cli.yml -f docker/docker-compose-rest.yml run --rm dspace-cli version

echo "====="
echo "Logs"
docker compose --env-file $ENVFILE -p $PROJECT -f docker/docker-compose.yml -f docker/docker-compose-rest.yml logs -n 50 || true
popd

echo "====="
echo "Copy assetstore"
docker cp assetstore dspace${INSTANCE}:/dspace/

echo "====="
echo "Finished start.sh"
