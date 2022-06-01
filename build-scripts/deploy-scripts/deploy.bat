REM set DSPACE_REST_HOST=dev-5.pc
REM set REST_URL=http://dev-5.pc:8080/server
REM set UI_URL=http://dev-5.pc/
set DSPACE_REST_IMAGE=dataquest/dspace:dspace-7_x
set DOCKER_OWNER=dataquest

docker-compose --env-file .env -f ../../docker/docker-compose.yml -f ../../docker/docker-compose-rest.yml pull

docker-compose --env-file .env -p dq-d7 -f ../../docker/docker-compose.yml -f ../../docker/docker-compose-rest.yml up -d --no-build

@REM If cannot create admin password, try remove images from ../../docker/cli.yml
docker-compose --env-file .env -p dq-d7 -f ../../docker/cli.yml run --rm dspace-cli create-administrator -e test@test.edu -f admin -l user -p admin -c en
docker-compose --env-file .env -p dq-d7 -f ../../docker/cli.yml run --rm dspace-cli version

pause