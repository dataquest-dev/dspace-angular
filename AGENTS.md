# AGENTS.md — testing this branch (dataquest dspace-angular)

Goal: spin up the **backend in Docker** and the **frontend natively** (live-editable
`ng serve`) and confirm they talk to each other, with the fewest moving parts.

This recipe was validated end-to-end on `internal/unify-docker-compose` (Windows + Docker
Desktop, Compose v2.40): BE up from one `.env.local`, FE on `ng serve` rendering in a real
browser against the BE (200s, CORS OK). It builds on PR #1289, which makes
`docker/docker-compose-rest.yml` drivable from a single `--env-file`.

> Several non-obvious traps below cost real time to find — read **Gotchas** before starting.

---

## Prerequisites

- **Docker** running.
- **Node 18** for the frontend. NOT 20+/24 — the Angular 15 toolchain breaks on newer Node
  in ways CI doesn't catch (CI only runs `build:prod`, not `ng serve`). Quick portable
  install, no global change:
  ```bash
  D=/c/Users/$USER/AppData/Local/Temp/node18setup; mkdir -p "$D" && cd "$D"
  curl -fsSL -o n18.zip https://nodejs.org/dist/v18.20.5/node-v18.20.5-win-x64.zip
  /c/Windows/System32/tar.exe -xf n18.zip                 # MSYS tar can't unzip; use Windows bsdtar
  ./node-v18.20.5-win-x64/npm.cmd install -g yarn@1.22.19  # yarn into the portable prefix
  export PATH="$D/node-v18.20.5-win-x64:$PATH"             # prepend for the FE commands
  ```
- **The `ng serve` fix** (see Gotcha #2): this branch pins `copy-webpack-plugin@^6.4.1`,
  which breaks `ng serve`. Bump it to `^11.0.0` in `package.json` and `yarn install`.

---

## TL;DR

```bash
# 1) BACKEND in Docker — fresh DB, migrate-on-boot, ~40-90s to healthy
cp docker/.env.local.example docker/.env.local   # then edit per "Backend" below
docker compose --env-file docker/.env.local -f docker/docker-compose-rest.yml up -d
#   wait: curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8087/server/api  => 200

# 2) FRONTEND natively (Node 18 on PATH, copy-webpack-plugin already bumped + installed)
DSPACE_REST_SSL=false DSPACE_REST_HOST=127.0.0.1 DSPACE_REST_PORT=8087 \
  DSPACE_UI_HOST=localhost DSPACE_UI_PORT=4000 \
  yarn start:dev                                  # live-reload on http://localhost:4000

# 3) teardown (-v wipes DB/Solr volumes — see Gotcha #4)
docker compose --env-file docker/.env.local -f docker/docker-compose-rest.yml down -v --remove-orphans
```

The FE config maps env vars onto `config/config.yml` (`rest.host`→`DSPACE_REST_HOST`,
`rest.port`→`DSPACE_REST_PORT`, …; env wins last — see `src/config/config.server.ts`), so
no file edits are needed to point the FE at the dockerized BE.

---

## Backend (Docker)

The BE network is fully defined in `docker/docker-compose-rest.yml`, so the BE comes up from
that file **alone** (no `docker-compose.yml` — that's the FE container, which we don't use).

`docker/.env.local` for this recipe (tuned for a **native** FE):

```ini
INSTANCE=7
# 127.0.0.1, NOT localhost (Gotcha #5). BE self-links use REST_URL, so keep it on 127.0.0.1.
DSPACE_HOST=127.0.0.1
DSPACE_REST_PORT=808${INSTANCE}            # -> 8087
DSPACE_REST_NAMESPACE=/server              # silences a harmless compose warning
REST_URL=http://127.0.0.1:808${INSTANCE}/server
UI_URL=http://localhost:4000               # native FE dev-server port, NOT 400${INSTANCE}
HOST_IP=127.0.0.1                          # loopback is enough for native FE; no LAN exposure
DSPACE_SUBNET_PREFIX=10.10${INSTANCE}      # dodge 172.2x collisions
REST_CORS_ALLOWED_ORIGINS=http://localhost:4000,http://127.0.0.1:4000
# Use the BE that MATCHES this FE branch (Gotcha #6). dtq-dev FE + dtq-dev-7.5 BE = DSpace 7.5.
DSPACE_REST_IMAGE=dataquest/dspace:dtq-dev-7.5
DSPACE_DB_IMAGE=dataquest/dspace-postgres-pgcrypto:dspace-7_x
DSPACE_SOLR_IMAGE=dataquest/dspace-solr:dspace-7_x
```

- **Ports** (INSTANCE=7): REST `8087`, JVM debug `8007`, Postgres `5437`, Solr `8987`. Change
  `INSTANCE` to re-target all at once. 5 and 8 are reserved by `.github/workflows/deploy.yml`.
- First boot runs `dspace database migrate force` on an empty DB. No content, no admin user
  (the homepage is intentionally near-empty — see "What success looks like"). To create an
  admin:
  ```bash
  docker compose --env-file docker/.env.local -f docker/docker-compose-rest.yml -f docker/cli.yml \
    run --rm dspace-cli create-administrator -e admin@test.dev -f admin -l user -p admin -c en -o dataquest
  ```

### Verify the BE
```bash
curl -s http://127.0.0.1:8087/server/api                       # dspaceName/dspaceVersion (=> DSpace 7.5)
curl -s -i -X OPTIONS http://127.0.0.1:8087/server/api/core/items \
  -H 'Origin: http://localhost:4000' -H 'Access-Control-Request-Method: GET' \
  | grep -i access-control-allow-origin                         # => http://localhost:4000
```
(Confirmed: allowed origin → `200` + matching `Access-Control-Allow-Origin`; other origin → `403`.)

---

## Frontend (native, live-editable)

```bash
# one-time: Node 18 on PATH, copy-webpack-plugin bumped to ^11, deps installed
export PATH="/c/Users/$USER/AppData/Local/Temp/node18setup/node-v18.20.5-win-x64:$PATH"
yarn install        # after the copy-webpack-plugin bump, or if node_modules is partial

DSPACE_REST_SSL=false DSPACE_REST_HOST=127.0.0.1 DSPACE_REST_PORT=8087 \
  DSPACE_UI_HOST=localhost DSPACE_UI_PORT=4000 \
  yarn start:dev      # ng serve, live-reload, http://localhost:4000
```

- `yarn start:dev` = `ng serve` (CSR dev server, fast rebuilds, what you want for editing).
  `yarn start` does a full SSR production build instead (slower; for an SSR-accurate check).
- The browser calls the BE **directly** at `http://127.0.0.1:8087/server`, so the BE CORS list
  must include `http://localhost:4000` (it does, above).
- Do **not** set `DSPACE_REST_NAMESPACE` from a Git-Bash shell (Gotcha #1); the config default
  `/server` is correct.

### What success looks like
`http://localhost:4000` renders the DSpace shell + the cookie-consent (Klaro) banner; the main
content area is empty because the repo is fresh. Browser DevTools → Network shows
`GET http://127.0.0.1:8087/server/api → 200`, `.../authn/status → 200`,
`.../discover/browses → 200`, `.../core/sites → 200`, with **no CORS errors**. A few benign
console errors are normal here: `favicon.ico` 404, Matomo refused (no analytics container),
`google.analytics.key` 404, and two DSpace-7.5 nuances (`/api/security/csrf` 404 and a
browse-definitions parse warning) — none block rendering.

---

## Gotchas (each one cost time to find)

1. **Git Bash mangles `DSPACE_REST_NAMESPACE=/server`** into `C:/Program Files/Git/server`
   (MSYS path conversion of a leading-slash value), corrupting the REST baseUrl. Fix: don't
   pass it (config default `/server` applies), or `export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'`.
   Inside the `.env.local` file it's NOT mangled — only shell exports are.

2. **`ng serve` is broken on this branch out of the box.** `package.json` pins
   `copy-webpack-plugin@^6.4.1`, but `@angular-builders/custom-webpack` (the serve builder)
   resolves it for build-angular@15, which passes the `priority` option (v9+ only) → 
   `An unhandled exception occurred: Copy Plugin … unknown property 'priority'`. CI misses it
   (it runs `build:prod`, not `ng serve`). Fix: set `"copy-webpack-plugin": "^11.0.0"` in
   `package.json` (matches build-angular's pin) and `yarn install`. Validated: `ng serve` then
   `✓ Compiled successfully`. (If pushing this fix, let CI re-run `build:prod` + tests.)

3. **Stale / partial `node_modules`.** `Can't resolve 'd3'` / `'ngx-skeleton-loader'` + a
   cascade of `NG6002`/`NG8004` → run a full `yarn install`.

4. **Stale Postgres volume version mismatch.** Re-using an old `dspace-7_pgdata` initialised by
   a different Postgres major gives `FATAL: database files are incompatible with server`; the BE
   then hangs forever in its DB-wait loop and REST never comes up. Fix: `down -v` for a clean
   start. `--remove-orphans` clears a leftover `dspace-angular<INSTANCE>` container.

5. **`localhost` ≠ `127.0.0.1` for the FE→BE hop.** Node 18 resolves `localhost` to IPv6 `::1`
   with no IPv4 fallback, but the BE publishes on `127.0.0.1` only (`host_ip`), so SSR/Node
   fetches `ECONNREFUSED` and you get `undefined doesn't contain the link sites`. Use
   `DSPACE_REST_HOST=127.0.0.1` (and `REST_URL=http://127.0.0.1:...` so the BE's HAL self-links
   match). `curl` hides this because it falls back to IPv4.

6. **Pair the FE with the matching BE version.** The `dtq-dev` FE branch against
   `dataquest/dspace:dspace-7_x` (DSpace 7.6.5) makes the FE's HAL parser recurse →
   `RangeError: Maximum call stack size exceeded` in `DspaceRestResponseParsingService`. Use the
   branch's matching BE, `dataquest/dspace:dtq-dev-7.5` (DSpace 7.5).

7. **Orphaned `ng serve` keeps port 4000.** Stopping the `nodemon` parent doesn't kill its
   spawned `ng serve` child, so the next start crashes on `Port 4000 is already in use` (the
   interactive prompt throws on a non-TTY). Kill the listener first:
   ```bash
   pid=$(netstat -ano | grep LISTENING | grep ':4000' | awk '{print $NF}' | head -1)
   taskkill //F //T //PID $pid          # Git Bash needs the // flag form
   ```

---

## Alternative: fully containerized FE (PR #1289's documented path)

To run the FE in Docker too (no native Node), use `docker/.env.local.example` as-is
(`DSPACE_HOST=host.docker.internal`, `HOST_IP=0.0.0.0`, CORS on `400${INSTANCE}`) and bring up
**both** files with a local build:
```bash
docker compose --env-file docker/.env.local \
  -f docker/docker-compose.yml -f docker/docker-compose-rest.yml up -d --build
# FE on http://localhost:4007 ; this build path exercises the Dockerfile cp fix from PR #1289.
```
`HOST_IP=0.0.0.0` publishes every BE port (incl. Postgres pwd `dspace`, JVM debug) on all
interfaces — dev-only, not for an untrusted network. The native-FE recipe above avoids this.
