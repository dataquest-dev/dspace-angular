docker-compose -f deploy.yml pull dspace
docker-compose -p our_dspace -f deploy.yml up -d dspace
pause
