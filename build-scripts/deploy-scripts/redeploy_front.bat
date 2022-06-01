docker-compose -p dq-d7 -f ../../docker/docker-compose.yml --env-file .env -f ../../docker/docker-compose-rest.yml pull dspace-angular
docker-compose -p dq-d7 -f ../../docker/docker-compose.yml --env-file .env -f ../../docker/docker-compose-rest.yml up -d --force-recreate dspace-angular

pause
