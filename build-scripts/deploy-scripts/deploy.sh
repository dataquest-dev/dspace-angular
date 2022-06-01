#!/bin/bash

DSPACE_REST_HOST=dev-5.pc
REST_URL=http://dev-5.pc:8080/server
UI_URL=http://dev-5.pc/
DSPACE_REST_IMAGE=dataquest/dspace:dspace-7_x
DOCKER_OWNER=dataquest

docker-compose -f ../../docker/docker-compose.yml -f ../../docker/docker-compose-rest.yml pull

# docker-compose.yml - frontend
docker-compose -p dq-d7 -f ../../docker/docker-compose.yml -f ../../docker/docker-compose-rest.yml up -d --no-build

# Create admin user
# set DOCKER_OWNER to match our image (see cli.yml)
DOCKER_OWNER=dataquest \
	docker-compose -p dq-d7 -f ../../docker/cli.yml run --rm dspace-cli create-administrator -e test@test.edu -f admin -l user -p admin -c en
