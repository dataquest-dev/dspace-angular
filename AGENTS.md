# AGENTS.md — testing this branch (dataquest dspace-angular)

Goal: spin up the **backend in Docker** and the **frontend natively** (live-editable
`ng serve`) and confirm they talk to each other, with the fewest moving parts.

Validated end-to-end on `internal/unify-docker-compose` (Windows + Docker Desktop, Compose
v2.40): BE up from one `.env.local`, FE on `ng serve` rendering the LINDAT/CLARIAH-CZ home in
a real browser with demo content (6 communities, 471 indexed items), 200s, no CORS errors.
Builds on PR #1289, which makes `docker/docker-compose-rest.yml` drivable from one `--env-file`.

> Several non-obvious traps below cost real time to find — read **Gotchas** before starting.
> **Match the BE to the FE version:** this FE reports **7.6.5** (see the browser console
> startup banner), so use a **7.6.5** backend image. A 7.5 BE (`dtq-dev-7.5`) parses most
> things but errors on browse definitions.

---

## Prerequisites

- **Docker** running.
- **Node 18** for the frontend. NOT 20+/24 — the Angular 15 toolchain breaks on newer Node in
  ways CI doesn't catch (CI runs `build:prod`, never `ng serve`). Portable install, no global
  change:
  ```bash
  D=/c/Users/$USER/AppData/Local/Temp/node18setup; mkdir -p "$D" && cd "$D"
  curl -fsSL -o n18.zip https://nodejs.org/dist/v18.20.5/node-v18.20.5-win-x64.zip
  /c/Windows/System32/tar.exe -xf n18.zip                 # MSYS tar can't unzip; use Windows bsdtar
  ./node-v18.20.5-win-x64/npm.cmd install -g yarn@1.22.19
  export PATH="$D/node-v18.20.5-win-x64:$PATH"            # prepend for FE commands
  ```
- **The `ng serve` fix** (Gotcha #2): the branch pins `copy-webpack-plugin@^6.4.1`, which
  breaks `ng serve`. Bump it to `^11.0.0` in `package.json` and `yarn install`. (This is now
  committed on PR #1289.)

---

## TL;DR — two commands

```bash
# 0) one-time: use Node 18 (see .nvmrc) and install deps
nvm use            # or: see Prerequisites for a portable Node 18
yarn install

# 1) BACKEND: DSpace 7.6.x at http://127.0.0.1:8087/server (~2-4 min first run). The image set is
#    recognised automatically (read from the compose files) and the script prints + validates the
#    running version/flavor after boot. Two flavors:
build-scripts/run/dev.backend.sh                       # upstream public demo (default): right version, public content
FLAVOR=clarin build-scripts/run/dev.backend.sh fresh   # the CORRECT CLARIN backend (dataquest) + CLARIN content
#    ('fresh' wipes volumes — required when switching flavor, since -loadsql only loads an empty DB)

# 2) FRONTEND: live-reload dev server on http://localhost:4000
yarn start:dev:local
```

`dev.backend.sh` brings the backend up (IPv4 host, CORS derived from `UI_PORT`, sample dataset),
reindexes Solr, then **recognises the running backend** and warns if its version/flavor won't match
this FE; `start:dev:local` is `ng serve` with the right `DSPACE_REST_*` env baked in.
Stop/wipe with `docker compose -f docker/docker-compose-rest.yml -f docker/db.entities.yml down -v`
(swap in `-f docker/db.clarin.yml` for the CLARIN flavor).

Everything below is the manual/explained version of those two commands (for customizing the
instance, image set, or running the FE in Docker). The FE maps env vars onto `config/config.yml`
(`rest.host`→`DSPACE_REST_HOST`, … ; env wins last — see `src/config/config.server.ts`).

---

## Backend (Docker)

`docker/docker-compose-rest.yml` fully defines the network, so the BE comes up from that file
(plus `db.entities.yml` for demo data) — no `docker-compose.yml` (that's the FE container).

### Backend image — recognised automatically (don't hardcode it)

`dev.backend.sh` does **not** hard-code the backend image. It **reads the image tags from the repo's
own compose files** (the source of truth), selects a set by `FLAVOR`, and after boot recognises the
running backend — printing its image, version, flavor, and a browse-definitions canary (the DSpace-7.5
mismatch trap). The image the compose file declares as its *default* is deliberately **not** the one to
run as-is:

| Source (in the code) | REST image | Flavor | Version |
|---|---|---|---|
| `docker/docker-compose-rest.yml:70` (compose default) | `dataquest/dspace:dtq-dev-7.5` | CLARIN | **7.5 — breaks browse-defs vs this 7.6.x FE** |
| `docker/docker-compose-ci.yml:38` (what CI validates) | `dataquest/dspace:dspace-7_x-test` | CLARIN | 7.6.x ✅ |
| `dev.backend.sh` `FLAVOR=upstream` (default) | `dspace/dspace:dspace-7_x` | upstream demo | 7.6.x ✅ |

So `FLAVOR=clarin` reads the **CI** default (version-correct CLARIN), *not* the rest.yml default;
`FLAVOR=upstream` (default) keeps the instant public-demo path. The post-boot recogniser prints:

```
 Backend recognised:
   image    : dspace/dspace:dspace-7_x
   version  : DSpace 7.6.7-SNAPSHOT    (this FE is 7.6.5)
   flavor   : upstream demo (CLARIN endpoints/content ABSENT)
   browse-definitions canary : HTTP 200  (OK)
   note: for the CORRECT CLARIN backend (CLARIN endpoints + content) run:
           FLAVOR=clarin build-scripts/run/dev.backend.sh fresh
```

(`FLAVOR=clarin` uses `docker/db.clarin.yml`, the CLARIN counterpart of `db.entities.yml`: a `-loadsql`
Postgres fed the dataquest CLARIN test dump — same image + dump that CI validates. First run pulls
~1-2 GB of dataquest images.)

`docker/.env.local` for this recipe:

```ini
INSTANCE=7
# 127.0.0.1, NOT localhost (Gotcha #5). BE self-links use REST_URL, so keep it on 127.0.0.1.
DSPACE_HOST=127.0.0.1
DSPACE_REST_PORT=808${INSTANCE}            # -> 8087
DSPACE_REST_NAMESPACE=/server
REST_URL=http://127.0.0.1:808${INSTANCE}/server
UI_URL=http://localhost:4000               # native FE dev-server port, NOT 400${INSTANCE}
HOST_IP=127.0.0.1
DSPACE_SUBNET_PREFIX=10.10${INSTANCE}
REST_CORS_ALLOWED_ORIGINS=http://localhost:4000,http://127.0.0.1:4000

# --- Option A: demo content (VERIFIED) — upstream 7.6.5 + db.entities.yml -------------------
# Matches the FE's 7.6.5 and loads the official DSpace demo entities dataset. NOTE: this is
# UPSTREAM DSpace data on an UPSTREAM BE, so CLARIN-specific FE calls 404 (harmless to render).
DSPACE_REST_IMAGE=dspace/dspace:dspace-7_x
DSPACE_DB_IMAGE=dspace/dspace-postgres-pgcrypto:dspace-7_x   # db.entities.yml overrides to -loadsql
DSPACE_SOLR_IMAGE=dspace/dspace-solr:dspace-7_x
DOCKER_REGISTRY=docker.io                  # consumed by db.entities.yml to resolve the -loadsql image
DOCKER_OWNER=dspace
DSPACE_VER=dspace-7_x

# --- Option B: CLARIN fidelity (version-matched, but no content unless you have a dump) ------
# DSPACE_REST_IMAGE=dataquest/dspace:dspace-7_x            # DSpace 7.6.5, CLARIN tables/endpoints
# DSPACE_DB_IMAGE=dataquest/dspace-postgres-pgcrypto:dspace-7_x
# DSPACE_SOLR_IMAGE=dataquest/dspace-solr:dspace-7_x
# Fresh DB = empty homepage. For real CLARIN content, restore a dataquest/LINDAT DB dump into
# dspacedb7 (pg_restore/psql) instead of layering db.entities.yml, then reindex.
```

- Bring up Option A with **both** files: `-f docker/docker-compose-rest.yml -f docker/db.entities.yml`.
  The `-loadsql` Postgres downloads + imports `dspace7-entities-data.sql` on first boot; the BE
  then runs `database migrate ignored`. **Then reindex Solr** (command above) or the homepage's
  browse/search/"What's New" stay empty even though the DB has data.
- For Option B (no `db.entities.yml`), use just `-f docker/docker-compose-rest.yml`.
- **Ports** (INSTANCE=7): REST `8087`, JVM debug `8007`, Postgres `5437`, Solr `8987`. Change
  `INSTANCE` to re-target all at once. 5 and 8 are reserved by `.github/workflows/deploy.yml`.
- Admin user (optional): `… -f docker/cli.yml run --rm dspace-cli create-administrator -e admin@test.dev -f admin -l user -p admin -c en -o dataquest`

### Verify the BE
```bash
curl -s http://127.0.0.1:8087/server/api                       # dspaceVersion => DSpace 7.6.5
curl -s http://127.0.0.1:8087/server/api/core/communities/search/top  # totalElements: 6 (demo)
curl -s -i -X OPTIONS http://127.0.0.1:8087/server/api/core/items \
  -H 'Origin: http://localhost:4000' -H 'Access-Control-Request-Method: GET' \
  | grep -i access-control-allow-origin                         # => http://localhost:4000
```

---

## Frontend (native, live-editable)

```bash
export PATH="/c/Users/$USER/AppData/Local/Temp/node18setup/node-v18.20.5-win-x64:$PATH"
yarn install        # after the copy-webpack-plugin bump, or if node_modules is partial
DSPACE_REST_SSL=false DSPACE_REST_HOST=127.0.0.1 DSPACE_REST_PORT=8087 \
  DSPACE_UI_HOST=localhost DSPACE_UI_PORT=4000 \
  yarn start:dev      # ng serve, live-reload, http://localhost:4000
```

- `yarn start:dev` = `ng serve` (CSR dev server, fast rebuilds — what you want for editing).
  `yarn start` does a full SSR production build instead.
- The browser calls the BE directly at `http://127.0.0.1:8087/server`; the CORS list must include
  `http://localhost:4000` (it does).
- Don't set `DSPACE_REST_NAMESPACE` from a Git-Bash shell (Gotcha #1); config default `/server`
  is correct.

### What success looks like
`http://localhost:4000` redirects to `/home` and renders the **LINDAT/CLARIAH-CZ Repository
Home**: search + facets (Author/Subject/Language), a **"What's New"** list of items, and the
footer. DevTools → Network shows `…8087/server/api/*` 200s with no CORS errors. Benign console
errors are normal: `favicon.ico` 404, Matomo refused, `google.analytics.key` 404, `/security/csrf`
404, and (with Option A's upstream BE) some CLARIN-specific 404s.

---

## Gotchas (each one cost time to find)

1. **Git Bash mangles leading-slash paths.** `DSPACE_REST_NAMESPACE=/server` becomes
   `C:/Program Files/Git/server`, and `docker exec dspace7 /dspace/bin/dspace …` becomes
   `…/Git/dspace/bin/dspace` (no such file). Fix: prefix the command with
   `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'`. (Values inside the `.env.local` file are NOT
   mangled — only shell args.)

2. **`ng serve` is broken on this branch out of the box.** `package.json` pins
   `copy-webpack-plugin@^6.4.1`, but build-angular@15 (via `@angular-builders/custom-webpack`)
   emits asset-copy patterns using the `priority` option (v9+) → `Copy Plugin … unknown property
   'priority'`. CI misses it (it runs `build:prod`, not `ng serve`). Fix: `^11.0.0` (matches
   build-angular) + `yarn install`. (Committed on PR #1289.)

3. **Stale / partial `node_modules`.** `Can't resolve 'd3'` / `'ngx-skeleton-loader'` + a cascade
   of `NG6002`/`NG8004` → run a full `yarn install`.

4. **Stale Postgres volume version mismatch.** Re-using an old `dspace-7_pgdata` initialised by a
   different Postgres major gives `FATAL: database files are incompatible with server`; the BE
   then hangs forever in its DB-wait loop. Fix: `down -v` for a clean start (`--remove-orphans`
   clears a leftover `dspace-angular<INSTANCE>` container).

5. **`localhost` ≠ `127.0.0.1` for the FE→BE hop.** Node 18 resolves `localhost` to IPv6 `::1`
   with no IPv4 fallback, but the BE publishes on `127.0.0.1` only, so Node fetches `ECONNREFUSED`
   → `undefined doesn't contain the link sites`. Worse, a host MISMATCH (FE on `127.0.0.1` but BE
   self-links on `localhost`) made the HAL parser resolve objects under two hostnames and recurse
   → `RangeError: Maximum call stack size exceeded` in `DspaceRestResponseParsingService`. Keep
   **both** `DSPACE_REST_HOST` and `REST_URL` on `127.0.0.1`. (`curl` hides this — it falls back
   to IPv4.)

6. **Match the BE to the FE version — now auto-checked.** The FE is **7.6.x**, so use a **7.6.x** BE.
   The `dataquest/dspace:dtq-dev-7.5` image (the compose *default*, see "Backend image — recognised
   automatically") is **DSpace 7.5** and causes `An error occurred while retrieving the browse
   definitions` in the console. `dev.backend.sh` now handles this for you: it picks a 7.6.x image by
   `FLAVOR` and runs a browse-definitions canary after boot, warning loudly if a 7.5-style BE is
   detected. For CLARIN fidelity use `FLAVOR=clarin` (the version-correct `dataquest/dspace:dspace-7_x-test`).

7. **Demo data ≠ empty repo, and Solr needs reindexing.** A fresh DB shows an empty homepage —
   that's expected, not a bug. Layer `db.entities.yml` (Option A) for sample content, then run
   `index-discovery -b` so browse/search/"What's New" populate. (The public
   `dspace7-entities-data.sql` now ships future 8.0/9.0/10.0 flyway entries; a 7.6.5 BE still
   reads the data fine via `migrate ignored`.)

8. **Orphaned `ng serve` keeps port 4000.** Stopping `nodemon` doesn't kill its `ng serve` child,
   so the next start crashes on `Port 4000 is already in use`. Kill the listener first:
   ```bash
   pid=$(netstat -ano | grep LISTENING | grep ':4000' | awk '{print $NF}' | head -1)
   taskkill //F //T //PID $pid
   ```
   And do NOT switch git branches while `ng serve` runs — it watches the working tree and will
   recompile against the wrong files. Stop it first (or use a separate `git worktree`).

---

## Alternative: fully containerized FE (PR #1289's documented path)

To run the FE in Docker too, use `docker/.env.local.example` as-is (`host.docker.internal`,
`HOST_IP=0.0.0.0`, CORS on `400${INSTANCE}`) and bring up **both** compose files with `--build`:
```bash
docker compose --env-file docker/.env.local \
  -f docker/docker-compose.yml -f docker/docker-compose-rest.yml up -d --build
# FE on http://localhost:4007 ; this build path exercises the Dockerfile cp fix from PR #1289.
```
`HOST_IP=0.0.0.0` publishes every BE port (incl. Postgres pwd `dspace`, JVM debug) on all
interfaces — dev-only, not for an untrusted network.
