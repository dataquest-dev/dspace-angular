# AGENTS.md — testing this branch (dataquest dspace-angular)

Goal: spin up the **backend in Docker** and the **frontend natively** (so the FE stays
live-editable) and confirm they talk to each other, with the fewest moving parts.

This recipe was validated on this branch (`internal/unify-docker-compose`) on Windows +
Docker Desktop (Compose v2.40.x). It leans on PR #1289, which makes
`docker/docker-compose-rest.yml` drivable from a single `--env-file` (parameterised
subnet + CORS), so **no `docker-compose.local.yml` override is needed**.

---

## TL;DR

```bash
# 0) prerequisites (see "Gotchas" for why): Docker running; Node 18 or 20 for the FE.

# 1) BACKEND in Docker (fresh DB, migrate-on-boot, ~90s to healthy)
cp docker/.env.local.example docker/.env.local      # then edit per "Backend" below
docker compose --env-file docker/.env.local -p dspace-7 \
  -f docker/docker-compose-rest.yml up -d
#   wait until: curl -s -o /dev/null -w '%{http_code}' http://localhost:8087/server/api  => 200

# 2) FRONTEND natively, pointed at the dockerized BE (live-reload on http://localhost:4000)
yarn install                                          # first run / after pulling deps
DSPACE_REST_SSL=false DSPACE_REST_HOST=localhost DSPACE_REST_PORT=8087 \
  DSPACE_UI_HOST=localhost DSPACE_UI_PORT=4000 \
  yarn start:dev

# 3) teardown (the -v wipes the DB/Solr volumes — see gotcha #4)
docker compose --env-file docker/.env.local -p dspace-7 \
  -f docker/docker-compose-rest.yml down -v --remove-orphans
```

Why this works: the FE config maps env vars onto `config/config.yml`
(`rest.host`→`DSPACE_REST_HOST`, `rest.port`→`DSPACE_REST_PORT`, …; env wins last — see
`src/config/config.server.ts`). The BE trusts the host and answers the browser because
PR #1289 lets `REST_CORS_ALLOWED_ORIGINS` list the FE origin (`http://localhost:4000`).

---

## Backend (Docker)

The BE network is fully defined in `docker/docker-compose-rest.yml`, so the BE comes up
from that file **alone** (you do not need `docker-compose.yml`, which is the FE container).

`docker/.env.local` used for this recipe (created from `docker/.env.local.example`, then
tuned for a **native** FE — i.e. CORS/UI on `localhost:4000`, loopback bind only):

```ini
INSTANCE=7
DSPACE_HOST=localhost
DSPACE_REST_PORT=808${INSTANCE}            # -> 8087
DSPACE_REST_NAMESPACE=/server              # silences a harmless compose warning (defaulted only in docker-compose.yml)
REST_URL=http://localhost:808${INSTANCE}/server
UI_URL=http://localhost:4000               # native FE dev server port, NOT 400${INSTANCE}
HOST_IP=127.0.0.1                          # loopback is enough for native FE; avoids LAN exposure
DSPACE_SUBNET_PREFIX=10.10${INSTANCE}      # dodge 172.2x collisions with other compose projects
REST_CORS_ALLOWED_ORIGINS=http://localhost:4000,http://127.0.0.1:4000
DSPACE_REST_IMAGE=dataquest/dspace:dspace-7_x
DSPACE_DB_IMAGE=dataquest/dspace-postgres-pgcrypto:dspace-7_x
DSPACE_SOLR_IMAGE=dataquest/dspace-solr:dspace-7_x
```

- **Ports** (INSTANCE=7): REST `8087`, JVM debug `8007`, Postgres `5437`, Solr `8987`,
  handle `2647`, handle-http `8017`. Change `INSTANCE` to re-target all of them at once.
  `INSTANCE` 5 and 8 are reserved by `.github/workflows/deploy.yml`.
- **Images** — overridable; if unset, the compose defaults apply. The `dataquest/*` set
  above is self-consistent with a **fresh, migrated** DB (no SQL dump needed). To preload
  the entities demo data instead, use the upstream `dspace/*` set and add
  `-f docker/db.entities.yml` (downloads + imports a SQL dump on first boot).
- First boot runs `dspace database migrate force` on an empty DB and deploys the `server`
  webapp (~90s here). No admin user exists yet; create one if you need to log in:
  ```bash
  docker compose --env-file docker/.env.local -p dspace-7 \
    -f docker/docker-compose-rest.yml -f docker/cli.yml \
    run --rm dspace-cli create-administrator \
    -e admin@test.dev -f admin -l user -p admin -c en -o dataquest
  ```

### Verify the BE
```bash
curl -s http://localhost:8087/server/api                       # JSON root: dspaceName/dspaceVersion/dspaceUI/dspaceServer
# CORS preflight must be allowed for the FE origin:
curl -s -i -X OPTIONS http://localhost:8087/server/api/core/items \
  -H 'Origin: http://localhost:4000' -H 'Access-Control-Request-Method: GET' \
  | grep -i access-control-allow-origin                         # => http://localhost:4000
```
(Confirmed: allowed origin → `200` + `Access-Control-Allow-Origin: http://localhost:4000`;
a non-listed origin → `403`.)

---

## Frontend (native, live-editable)

```bash
yarn install        # REQUIRED if node_modules is missing/partial (see gotcha #3)
DSPACE_REST_SSL=false DSPACE_REST_HOST=localhost DSPACE_REST_PORT=8087 \
  DSPACE_UI_HOST=localhost DSPACE_UI_PORT=4000 \
  yarn start:dev    # nodemon -> ng serve, live-reload on http://localhost:4000
```

- `yarn start:dev` runs `ng serve` (CSR dev server, fast rebuilds). `yarn start` instead
  does a full SSR production build (`build:prod && serve:ssr`) — slower, only for an
  SSR-accurate check.
- The browser calls the BE **directly** at `http://localhost:8087/server`, so the BE CORS
  list (above) must include `http://localhost:4000`.
- Do **not** set `DSPACE_REST_NAMESPACE` from a Git-Bash shell — see gotcha #1. The default
  `/server` from `config/config.yml` is already correct.

---

## Gotchas (all hit while validating this)

1. **Git Bash mangles `DSPACE_REST_NAMESPACE=/server`** into `C:/Program Files/Git/server`
   (MSYS path conversion of a leading-slash value), which corrupts the REST baseUrl. Fix:
   don't pass it (config default `/server` applies), or `export MSYS_NO_PATHCONV=1
   MSYS2_ARG_CONV_EXCL='*'` first. (Inside the `.env.local` file it is **not** mangled — only
   shell exports are.)

2. **Node 24 breaks the FE build.** This branch targets Node **18** (`Dockerfile`) / 18–20
   (CI). On Node 24 `ng serve`/`ng build` dies with
   `Copy Plugin … unknown property 'priority'` (Angular 15's bundled copy-webpack-plugin v11
   gets shadowed by the top-level v6.4.1 under Node 24's resolution). Use Node 18 or 20
   (e.g. via `nvm`). The dependency tree itself is correct — this is purely the runtime Node
   version.

3. **Stale / partial `node_modules`.** If you see `Can't resolve 'd3'` /
   `'ngx-skeleton-loader'` and a cascade of `NG6002`/`NG8004` errors, `node_modules` is
   incomplete — run a full `yarn install` (it takes a few minutes).

4. **Stale Postgres volume version mismatch.** Re-using an old `dspace-7_pgdata` volume that
   a *different* Postgres major initialised gives
   `FATAL: database files are incompatible with server (… initialized by PostgreSQL version 15 … not compatible with version 13)`;
   the BE then hangs forever in its DB-wait loop and REST never comes up. Fix: start clean
   with `down -v` (wipes the project's volumes), then `up -d`. A leftover orphan FE container
   (`dspace-angular<INSTANCE>`) from a prior run is cleared by `--remove-orphans`.

5. **Orphaned `ng serve` keeps port 4000.** Stopping the `nodemon` parent does **not** kill
   its spawned `ng serve` child, so the next start crashes on `Port 4000 is already in use`
   (the interactive "use another port?" prompt then throws on a non-TTY). Kill the listener
   first:
   ```bash
   pid=$(netstat -ano | grep LISTENING | grep ':4000' | awk '{print $NF}' | head -1)
   taskkill //F //T //PID $pid          # Git Bash needs the // flag form
   ```

---

## Alternative: fully containerized FE (PR #1289's documented path)

If you want the FE in Docker too (no native Node), use `docker/.env.local.example` as-is
(it sets `DSPACE_HOST=host.docker.internal`, `HOST_IP=0.0.0.0`, CORS on `400${INSTANCE}`)
and bring up **both** files with a local build:

```bash
docker compose --env-file docker/.env.local -p dspace-7 \
  -f docker/docker-compose.yml -f docker/docker-compose-rest.yml up -d --build
# FE on http://localhost:4007 ; that build path exercises the Dockerfile cp fix from PR #1289.
```
Note `HOST_IP=0.0.0.0` publishes every BE port (incl. Postgres pwd `dspace`, JVM debug) on
all interfaces — dev-only, do not use on an untrusted network. The native-FE recipe above
avoids this by binding loopback only.
```
