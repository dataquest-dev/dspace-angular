docker-compose -f deploy.yml pull dspace-angular
docker-compose -p our_dspace -f deploy.yml up -d dspace-angular
pause
