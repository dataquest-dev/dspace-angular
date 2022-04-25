docker-compose -f deploy.yml pull
docker-compose -p our_dspace -f deploy.yml up -d
@REM If cannot create admin password, try remove images from ../../docker/cli.yml
docker-compose -p our_dspace --env-file deployable.env -f ../../docker/cli.yml run --rm dspace-cli create-administrator -e test@test.edu -f admin -l user -p admin -c en
pause