#!/bin/bash
if [[ "x$ENVFILE" == "x" ]]; then
    export ENVFILE=$(pwd)/envs/.default
    echo "Using default envfile"
fi

PROJECT=${1:-unnamed_dspace}

echo "Using envfile: [$ENVFILE] for project: [$PROJECT]"

source $ENVFILE

# docker-compose does not pull those that have `build` section?!
echo "====="
docker pull $DSPACE_UI_IMAGE

pushd ../..
echo "====="
docker compose --env-file $ENVFILE -f docker/docker-compose.yml -f docker/docker-compose-rest.yml pull
docker compose --env-file $ENVFILE -p $PROJECT -f docker/docker-compose.yml -f docker/docker-compose-rest.yml up -d --no-build --remove-orphans
popd

# Create admin user
# set DOCKER_OWNER to match our image (see cli.yml)
pushd ../..
echo "====="
#docker compose --env-file $ENVFILE -p $PROJECT -f docker/matomo-w-db.yml pull
#docker compose --env-file $ENVFILE -p $PROJECT -f docker/matomo-w-db.yml up -d --no-build

# Ensure CLI container uses the same project network
export COMPOSE_PROJECT_NAME=$PROJECT

# docker-compose-rest.yml must be last, since it specifies network in more detail. If it is not last, there is "root must be a mapping" error.
if [[ -z "$ADMIN_PASSWORD" ]]; then
    echo "ERROR: ADMIN_PASSWORD is required but not set." >&2
    exit 1
fi
if [[ -z "$USER_PASSWORD" ]]; then
    echo "ERROR: USER_PASSWORD is required but not set." >&2
    exit 1
fi
echo "Creating administrator user..."
docker compose --env-file $ENVFILE -p $PROJECT -f docker/docker-compose.yml -f docker/cli.yml -f docker/docker-compose-rest.yml run --rm dspace-cli create-administrator -e dspace.admin.dev@dataquest.sk -f admin -l user -p "${ADMIN_PASSWORD}" -c en

echo "Creating regular user..."
docker compose --env-file $ENVFILE -p $PROJECT -f docker/docker-compose.yml -f docker/cli.yml -f docker/docker-compose-rest.yml run --rm dspace-cli user --add -m dspace.user.dev@dataquest.sk -g meno -s priezvisko -l en -p "${USER_PASSWORD}"

echo "Checking DSpace version..."
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
