REM set DSPACE_REST_HOST=dev-5.pc
REM set REST_URL=http://dev-5.pc:8080/server
REM set UI_URL=http://dev-5.pc/
set DSPACE_REST_IMAGE=dataquest/dspace:dspace-7_x
set DOCKER_OWNER=dataquest

IF "%ENVFILE%"=="" set ENVFILE=%cd%/envs/.default

call start.backend.bat nopause
call start.frontend.bat nopause

pushd ..\..
if [[ -z "$ADMIN_PASSWORD" ]]; then
    echo "ERROR: ADMIN_PASSWORD is required but not set." >&2
    exit 1
fi
docker-compose --env-file %ENVFILE% -p dq-d7 -f docker/cli.yml run --rm dspace-cli create-administrator -e dspace.admin.dev@dataquest.sk -f admin -l user -p "${ADMIN_PASSWORD}" -c en
docker-compose --env-file %ENVFILE% -p dq-d7 -f docker/cli.yml run --rm dspace-cli version
popd

IF "%1"=="nopause" GOTO No1
    echo %~n0
    pause
:No1