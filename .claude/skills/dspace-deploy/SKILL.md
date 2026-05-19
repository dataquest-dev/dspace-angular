---
name: dspace-deploy
description: Deploy the current dspace-angular sources (FE) together with the BE (dspace, dspacedb, dspacesolr) locally via Docker compose. Multi-instance safe — every instance uses a distinct INSTANCE digit (1-9) so ports / container names / subnets do not clash. Use this when the user asks to "start the stack", "fire up dspace locally", "spin up FE+BE", "deploy current sources locally", or "run multiple instances side by side".
---

# /dspace-deploy — Spin up DSpace FE + BE locally

## What this skill does

Brings up a local DSpace 7 stack (Angular FE + REST BE + Postgres + Solr) for the **current source branch** using Docker compose, in a way that is **multi-instance safe** — multiple instances can run on the same host because every port, container name, network subnet and volume namespace is parameterised by a single digit `INSTANCE` (1-9).

Heavy lifting is delegated to the existing `docker/docker-compose.yml` + `docker/docker-compose-rest.yml`, which already use `${INSTANCE}` everywhere. A generated compose override file:
- relocates the network subnet to `10.10${INSTANCE}.0.0/16` (the default `172.2${INSTANCE}.0.0/16` clashes with most users' other compose projects);
- adds `host.docker.internal:host-gateway` to the FE container so SSR can reach the BE via the host gateway — and Docker Desktop already wires `host.docker.internal` into the Windows hosts file, so the browser on the host resolves the same hostname.

## Resulting URLs

For a given `INSTANCE=N`:

| Service     | Host URL                                | Container         |
|-------------|-----------------------------------------|-------------------|
| Angular UI  | `http://localhost:400N/`                | `dspace-angularN` |
| REST API    | `http://localhost:808N/server/api`      | `dspaceN`         |
| Postgres    | `localhost:543N`                        | `dspacedbN`       |
| Solr admin  | `http://localhost:898N`                 | `dspacesolrN`     |

## Helper script

`scripts\dspace-deploy.bat` — a Windows cmd batch script (NO PowerShell — the user has explicitly forbidden it).

Invocation:

```
scripts\dspace-deploy.bat [INSTANCE] [ACTION] [TAG]
```

- `INSTANCE` — single digit 1-9, default `7` (5 and 8 are reserved for the prod deploy workflow).
- `ACTION` — `up` (default), `rebuild` (force-recreate with `--build`), `down`, `status`, `logs`.
- `TAG` — image tag for all four images (default `dspace-7_x`).

Examples:

```
scripts\dspace-deploy.bat                       :: up instance 7 using published images
scripts\dspace-deploy.bat 6                     :: up instance 6
scripts\dspace-deploy.bat 7 rebuild             :: rebuild FE from current sources + force-recreate
scripts\dspace-deploy.bat 7 down                :: tear down instance 7 (with -v)
scripts\dspace-deploy.bat 7 status              :: show compose ps
scripts\dspace-deploy.bat 7 logs                :: follow logs
```

## How to invoke from the agent

1. Confirm Docker is reachable (`docker info`).
2. Pick `INSTANCE` (arg or `7`).
3. Refuse to overwrite a running stack with the same `INSTANCE` unless `rebuild` is explicitly requested.
4. Run the batch script via `Bash` (it works under MINGW/Git Bash too — paths are absolute via `%~dp0`).
5. After `up`, the script itself polls FE + BE up to ~7.5 min and prints the URL table.

## Multi-instance contract

`docker/docker-compose.yml` and `docker/docker-compose-rest.yml` already use `${INSTANCE}` in:

- Ports: `400${INSTANCE}`, `808${INSTANCE}`, `543${INSTANCE}`, `898${INSTANCE}`, `264${INSTANCE}`, `801${INSTANCE}`, `987${INSTANCE}`.
- Container names: `dspace${INSTANCE}`, `dspacedb${INSTANCE}`, `dspacesolr${INSTANCE}`, `dspace-angular${INSTANCE}`.
- Subnet (overridden by this skill to `10.10${INSTANCE}.0.0/16`).

So a 2nd instance just needs `scripts\dspace-deploy.bat 6` while `7` is up.

## Notes

- **Local dev / verification only**. The production-style deploy on `dev-5` uses `.github/workflows/deploy.yml`; do not reuse this skill there.
- First start downloads ~4 GB of images and the BE may take 2-5 minutes to be ready (Solr cores + DB migration).
- Admin user / data ingestion is **not** performed automatically. If needed, run `docker compose -p dspace-N -f docker/docker-compose.yml -f docker/cli.yml -f docker/docker-compose-rest.yml run --rm dspace-cli create-administrator ...`.
- **NEVER use PowerShell here.** Per user instruction, only cmd / bash. The helper script is a `.bat` deliberately.
