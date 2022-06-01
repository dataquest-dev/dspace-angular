docker-compose -p dq-d7 -f ../../docker/docker-compose.yml -f ../../docker/docker-compose-rest.yml pull dspace
docker-compose -p dq-d7 -f ../../docker/docker-compose.yml -f ../../docker/docker-compose-rest.yml up -d --force-recreate dspace

pause
