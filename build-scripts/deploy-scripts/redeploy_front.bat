docker-compose --env-file .env -p dq-d7 -f ../../docker/docker-compose.yml -f ../../docker/docker-compose-rest.yml pull dspace-angular
docker-compose --env-file .env -p dq-d7 -f ../../docker/docker-compose.yml -f ../../docker/docker-compose-rest.yml up -d --force-recreate dspace-angular

pause
