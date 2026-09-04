# Atlas deployment

> Azure DevOps pipelines + Terraform. Static Web Apps for the web, a Container App for
> the API, Azure Artifacts for the packages. This is the guide; the pipelines are
> documented step by step in [`.azure-pipelines/README.md`](../.azure-pipelines/README.md)
> and the Terraform in [`infra/README.md`](../infra/README.md).

## 1. Deployable units

| # | Unit | Sources | Build | Artefact | Runs as | Terraform stack |
|---|---|---|---|---|---|---|
| 1 | web app | `web/apps/atlas` | `pnpm build:app` (Vite) | `web/apps/atlas/dist/` + `dist/config.json` written per environment | Azure Static Web App **app** (`<prefix>-<env>-app`) | `infra/stacks/web-app` |
| 2 | storybook | `web/packages/core` | `pnpm build:storybook` | `web/packages/core/storybook-static/` | Azure Static Web App **storybook** (`<prefix>-<env>-storybook`) | `infra/stacks/storybook` |
| 3 | api | `src/Atlas.Api` | `docker build -f src/Atlas.Api/Dockerfile .` | image `atlas-api:<build id>` in Azure Container Registry | Azure Container App `<prefix>-<env>-api`; the Azure Files share `i18n` mounted at `/data/i18n` | `infra/stacks/api` |
| 4 | npm packages | `web/packages/*`, `web/slices/*` | `pnpm build:packages` (`tsc -p tsconfig.build.json` per package) | `dist/` per package (ESM + `.d.ts`) | Azure Artifacts npm feed | — |
| 5 | nuget packages | `src/Atlas.Functional.Commands`, `src/Atlas.Upstream.Contracts` | `dotnet pack` | `*.nupkg` | Azure Artifacts NuGet feed | — |
| 6 | foundation | `infra/stacks/foundation` | `terraform plan` / `apply` | resource group, Log Analytics + App Insights, registry + pull identity, storage account + share `i18n` | one resource group per environment | `infra/stacks/foundation` |

Units 1–3 are what runs, 4–5 are what other repositories consume, 6 is what 1–3 share.
Each has its own pipeline (section 3) and — for 1–3 and 6 — its own Terraform stack with its
own state (section 5), so a change to one unit plans, applies and ships that unit alone.

What the rest of this guide leans on:

- **The web app is a static site.** Vite writes `index.html`, hashed assets and everything
  in `web/apps/atlas/public/` — `config.json` and `staticwebapp.config.json` — into `dist/`.
  There is no server code: the API is called cross-origin, which is why the API carries a
  CORS list. `staticwebapp.config.json` gives the Static Web App its SPA fallback
  (`/index.html` for unknown routes, with `/config.json` and the assets excluded), serves
  `/config.json` with `Cache-Control: no-cache`, and sets the security headers.
- **Storybook is a second static site** with no runtime configuration at all.
- **The API image** (`src/Atlas.Api/Dockerfile`) is multi-stage: the `sdk:10.0` stage
  restores from the `.csproj` files alone — a cached layer until a project file changes —
  then publishes; the `aspnet:10.0` stage runs as the non-root `app` user, listens on 8080
  and owns `/data/i18n`. No `HEALTHCHECK` is baked in; Container Apps probes `GET /healthz`
  itself. The build context is the repo root and `.dockerignore` keeps `web/`, `infra/`,
  `deck/`, `bin/`, `obj/` and `.git/` out of it.
- **The npm packages stay source-linked in development** (`main` → `./src/index.ts`,
  `workspace:*` between them). `publishConfig` in each `package.json` repoints `main`,
  `types` and `exports` at `dist/` for the published copy, and `files: ["dist"]` keeps the
  sources out of the tarball. `@atlas/app` is `private` and is never published.
- **The two NuGet packages** opt in with `IsPackable=true` in their `.csproj`.
  `Directory.Build.props` sets `VersionPrefix` 0.1.0, deterministic builds, and
  `ContinuousIntegrationBuild` when `TF_BUILD` is set.

## 2. Build once, configure at deploy

Nothing environment-specific is baked into a build. The same `dist/` and the same image go
to dev and then to prod; what differs is written next to the artefact or handed to the
container at deploy time.

### The web app: `/config.json`

`web/apps/atlas/src/main.tsx` awaits `loadRuntimeConfig()` from `@atlas/platform`
(`web/packages/platform/src/runtimeConfig.ts`) before rendering anything. It fetches
`/config.json` with `cache: 'no-store'` and expects

```json
{ "apiBaseUrl": "https://<api host>/api" }
```

A missing, unreadable or malformed file yields the default, `http://localhost:5179/api`,
and never throws. Locally that file is `web/apps/atlas/public/config.json`, which Vite
copies into `dist/`; on deploy, `.azure-pipelines/templates/deploy-static-web-app.yml`
overwrites `dist/config.json` with the environment's `API_BASE_URL` before uploading. Keep
the `/api` suffix: the slices append `/commitments`, `/reference` and `/i18n/…` to it.

### The API: environment variables

ASP.NET Core reads configuration from environment variables with `__` as the section
separator, so every key in `appsettings.json` has an environment form.

| Variable | Container (set by the `api` stack through `infra/modules/container-app`) | Local `dotnet run` | Purpose |
|---|---|---|---|
| `ASPNETCORE_URLS` | `http://+:8080` (also the image default) | `http://localhost:5179` (`appsettings.Development.json`, `launchSettings.json`) | listen address |
| `Cors__Origins__0..n` | the `web_origins` list in `infra/env/<env>.tfvars` — the web-app stack's `url` | `http://localhost:5173`, `http://localhost:4173` from `appsettings.Development.json` | browser origins allowed to call the API |
| `I18n__Folder` | `/data/i18n` (also the image default) | unset → `<content root>/i18n`, else `i18n/` next to the binary | the translations folder, absolute or content-root-relative |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | a Container App secret; the `api` stack reads the foundation App Insights by name | unset | telemetry |

The image also clears `ASPNETCORE_HTTP_PORTS`, which the base image pre-sets, so
`ASPNETCORE_URLS` wins without a startup warning.

**CORS has no production default.** `appsettings.json` lists no origins and the container
runs as Production, so nothing is allowed until `Cors__Origins__0..n` is set — no origins
means no CORS headers, and the API still answers `curl`. The Vite ports live in
`appsettings.Development.json` only, on purpose: array entries merge by index, so a committed
localhost entry would survive an override. On Azure the list is `web_origins` in
`infra/env/<env>.tfvars`, set per environment to the web-app stack's `url` output after its
first apply (section 5). It is empty on a fresh environment.

### Health

`GET /healthz` returns `200 { "status": "ok" }` and is excluded from the OpenAPI document.
The Container App uses it for both probes on port 8080: liveness (10 s initial delay, every
10 s) and readiness (every 5 s).

## 3. Pipelines

Azure DevOps YAML. The gate is at the repo root, the deploys under `.azure-pipelines/`,
shared steps under `.azure-pipelines/templates/`. Each file is registered once in Azure
DevOps (Pipelines → New pipeline → *Existing Azure Pipelines YAML file*). Every deploy
pipeline also triggers on its own YAML and on the templates it uses, so a pipeline fix ships
with the next run.

| Pipeline | Runs on | Path filters | Stages |
|---|---|---|---|
| `azure-pipelines.yml` | PR + `main` | none | **CI** — four parallel jobs: Web (`build:packages`, `typecheck`, `build:app`, `build:storybook`), Api (`dotnet build`, `test`, `pack`), Lint (`deno lint`, `deno test -A`), Infra (`terraform fmt -check` + `validate`, a matrix over the four stacks, no Azure access). Publishes the `web-app`, `storybook` and `nuget` artefacts. Deploys nothing. |
| `.azure-pipelines/deploy-web-app.yml` | `main` | `web/apps/atlas/**`, `web/packages/**`, `web/slices/**`, `infra/stacks/web-app/**`, `infra/modules/**`, `infra/env/**` | Build → Deploy_Dev → Deploy_Prod. Each deploy stage applies the `web-app` stack, reads its `api_key` and deploys `dist/` with it |
| `.azure-pipelines/deploy-storybook.yml` | `main` | `web/packages/core/**`, `web/packages/design-tokens/**`, `infra/stacks/storybook/**`, `infra/modules/**`, `infra/env/**` | Build → Deploy_Dev → Deploy_Prod. The same with the `storybook` stack and `storybook-static/` |
| `.azure-pipelines/deploy-api.yml` | `main` | `src/**`, `tests/**`, `infra/stacks/api/**`, `infra/modules/**`, `infra/env/**` | Build (`dotnet test`, `docker build`, push `atlas-api:<build id>` to the dev registry) → Deploy_Dev (apply the `api` stack with `-var api_image_tag=<build id>`) → Deploy_Prod (`az acr import` the tag into the prod registry, then the same apply) |
| `.azure-pipelines/publish-packages.yml` | `main`, tags `v*` | `web/packages/**`, `web/slices/**`, `src/**` | Publish — jobs Npm (`pnpm publish -r`) and NuGet (`dotnet pack` + `dotnet nuget push`) |
| `.azure-pipelines/infra.yml` | PR + `main` | PR: `infra/**`; `main`: `infra/stacks/foundation/**`, `infra/modules/**`, `infra/env/**` | Plan_Dev → Apply_Dev → Plan_Prod → Apply_Prod, all for the `foundation` stack (the apply stages run on `main` only). A PR also runs Plan_Stacks: a plan of `api`, `web-app` and `storybook` against dev |

Path triggers keep the units independent: a push that touches only `web/slices/` runs the
web-app deploy and the package publish; one that touches `src/` runs the API deploy and the
package publish; `infra/stacks/api/` runs the API deploy alone and `infra/stacks/foundation/`
runs `infra.yml` alone. Only the shared Terraform code — `infra/modules/`, `infra/env/` —
fans out to every pipeline that applies a stack. Nothing is shared between pipelines at run
time except the variable groups.

**Package versions.** A build of `main` stamps `0.1.0-ci.<Build.BuildId>` on every
workspace package and both NuGet packages, publishes npm under the `ci` dist-tag and uses
the feeds named in `atlas-dev`. A `vX.Y.Z` tag publishes `X.Y.Z` under `latest`, from
`atlas-prod`. All packages in one run share the version, so `workspace:*` and project
references resolve in the published manifests.

**Templates** (`.azure-pipelines/templates/`): `setup-pnpm.yml` (Node 24.x, pnpm 11, a
cached store, `pnpm install --frozen-lockfile`), `setup-dotnet.yml` (the SDK from
`global.json`), `setup-deno.yml` (Deno 1.46.3), `terraform.yml` (`validate` | `plan` |
`apply` of one stack against one environment; its `outputs` list copies
`terraform output -raw <name>` into variables of the job, secret when asked),
`deploy-static-web-app.yml` (download an artefact, write `config.json`,
`AzureStaticWebApp@0` with `skip_app_build` and the deployment token passed in).

## 4. Variable groups, secrets and the service connection

Nothing environment-specific is committed. Two variable groups under Pipelines → Library,
**`atlas-dev`** and **`atlas-prod`**, carry the same variable names with per-environment
values; each deploy stage binds the matching group. The values below are placeholders.

| Variable | Used by | Placeholder |
|---|---|---|
| `PREFIX` | deploy-api | first segment of every resource name, e.g. `atlas`; must equal `prefix` in `infra/env/<env>.tfvars`. Names the registries `<prefix>devacr` / `<prefix>prodacr` |
| `API_BASE_URL` | deploy-web-app | `https://<api fqdn>/api` — the api stack's `url` output plus `/api` |
| `NPM_FEED_URL` | publish-packages | `https://pkgs.dev.azure.com/<org>/<project>/_packaging/<feed>/npm/registry/` |
| `NUGET_FEED_URL` | publish-packages | `https://pkgs.dev.azure.com/<org>/<project>/_packaging/<feed>/nuget/v3/index.json` |
| `TF_STATE_RESOURCE_GROUP` | every stack apply | resource group of the state storage account |
| `TF_STATE_STORAGE_ACCOUNT` | every stack apply | the state storage account |
| `TF_STATE_CONTAINER` | every stack apply | `tfstate` |

No resource name and no secret is stored. The pipelines derive the names from `PREFIX` and
the environment with the naming convention (section 5), and the Static Web App deployment
tokens come out of the `web-app` and `storybook` stacks at run time: `terraform.yml` exports
`api_key` as the secret job variable `SWA_DEPLOYMENT_TOKEN` for the deploy step that follows
it. `deploy-api` pushes to `<prefix>devacr` and imports the tag into `<prefix>prodacr`, so
`PREFIX` must be the same in both groups.

**Service connection `atlas-azure`** — an Azure Resource Manager connection; workload
identity federation preferred, a client secret works too (`terraform.yml` handles either).
It needs `Contributor` on the subscription (the `foundation` stack creates the resource
groups, and every deploy pipeline applies a stack), the right to create role assignments
(`User Access Administrator` or `Role Based Access Control Administrator`, because
`foundation` grants `AcrPull` to the pull identity) and `Storage Blob Data Contributor` on
the state storage account. `Contributor` on the registries already covers `docker push` and
`az acr import`.

**Feeds** — Azure Artifacts feeds in the same organisation. Give `<project> Build Service
(<org>)` the Contributor role on the feed; `npmAuthenticate@0` and `NuGetAuthenticate@1`
then sign in with the pipeline's own identity. No personal access token is stored anywhere.

## 5. Terraform

```
infra/
├── env/
│   ├── dev.tfvars            Free SWAs, Basic ACR, 0..2 replicas (scales to zero), 30-day logs
│   └── prod.tfvars           Standard SWAs and ACR, 1..5 replicas, 90-day logs
├── modules/
│   ├── naming/               the names every stack agrees on (no resources)
│   ├── resource-group/       one resource group per environment
│   ├── monitoring/           Log Analytics workspace + workspace-based App Insights
│   ├── registry/             Azure Container Registry + the user-assigned pull identity (AcrPull)
│   ├── storage/              storage account + the Azure Files share "i18n"
│   ├── container-app/        Container Apps environment + the API app: ingress 8080, probes, env vars, the i18n mount
│   └── static-web-app/       one Static Web App (used by two stacks: app + storybook)
└── stacks/
    ├── foundation/           resource group, monitoring, registry + pull identity, storage + i18n share
    ├── api/                  Container Apps environment + the API container app
    ├── web-app/              Static Web App "app"
    └── storybook/            Static Web App "storybook"
```

Every stack has the same files: `backend.tf` (an empty `backend "azurerm" {}`, filled by
`-backend-config`), `versions.tf` (terraform >= 1.9, azurerm ~> 4.0), `providers.tf`,
`variables.tf`, `main.tf`, `outputs.tf` and a committed `.terraform.lock.hcl`.
`variables.tf` is identical in all four: every stack loads the whole of `env/<env>.tfvars`
and reads what it needs. Names come from `modules/naming` — `<prefix>-<env>-<unit>`; the
registry and storage account drop the hyphens (`atlasdevacr`, `atlasdevst`) and must be
globally unique, so pick a `prefix` that is yours.

### One stack per unit

Every deployable has to be developed, deployed and rolled back on its own, so no root
module composes them all. A single root would plan the whole environment on every apply, a
broken change in one unit would block the others, and every pipeline would queue on the
same state lock. Instead:

- **One state per stack.** Each stack keeps its own blob in the state container,
  `<env>/<stack>.tfstate` — `dev/web-app.tfstate`, `prod/api.tfstate` — which `init`
  creates on first use. `terraform.yml` builds the key from its `stack` and `env`
  parameters.
- **Coupling by name, not by state.** `foundation` owns what is shared by definition; the
  other stacks find those resources with data sources on the names `modules/naming`
  produces. `api` reads `azurerm_resource_group`, `azurerm_container_registry`,
  `azurerm_user_assigned_identity`, `azurerm_log_analytics_workspace`,
  `azurerm_application_insights` and `azurerm_storage_account`; the two sites read the
  resource group. No `terraform_remote_state`, so no stack depends on another stack's state
  file or output layout. The one value that crosses stacks — the web app's origin, for
  CORS — travels through `web_origins` in `env/<env>.tfvars`.
- **Apply order.** `foundation` first, then `web-app` and `storybook` in any order, then
  `api`, which needs the registry and a pushed image (first bring-up, below). After that
  any order: each pipeline applies its own stack on every run and a no-op apply is cheap.
- **A pipeline applies only its own stack and reads its own outputs.** `deploy-web-app`
  and `deploy-storybook` run `terraform apply` on their stack, then
  `terraform output -raw api_key` into the secret job variable `SWA_DEPLOYMENT_TOKEN` and
  hand it to `AzureStaticWebApp@0` in the same job; the deployment token never sits in a
  variable group. `deploy-api` applies `api` with `-var api_image_tag=<build id>` — the
  stack owns the image reference and rolls the revision. `infra.yml` applies `foundation`
  only.

| Stack | Applied by | State key | Reads from foundation (by name) | Outputs |
|---|---|---|---|---|
| `foundation` | `infra.yml` | `<env>/foundation.tfstate` | — | `resource_group_name`, `location`, `acr_login_server`, `acr_pull_identity_id`, `log_analytics_workspace_id`, `storage_account_name`, `i18n_share_name` |
| `web-app` | `deploy-web-app.yml` | `<env>/web-app.tfstate` | resource group | `hostname`, `url`, `api_key` (sensitive) |
| `storybook` | `deploy-storybook.yml` | `<env>/storybook.tfstate` | resource group | `hostname`, `url`, `api_key` (sensitive) |
| `api` | `deploy-api.yml` | `<env>/api.tfstate` | resource group, registry, pull identity, Log Analytics, App Insights, storage account | `fqdn`, `url` |

### Bootstrap (once per subscription)

Terraform state lives in a blob container that Terraform itself does not manage:

```bash
LOCATION=westeurope
STATE_RG=atlas-tfstate-rg
STATE_SA=atlastfstate$RANDOM        # 3-24 lowercase alphanumerics, globally unique

az group create --name $STATE_RG --location $LOCATION
az storage account create \
  --name $STATE_SA --resource-group $STATE_RG --location $LOCATION \
  --sku Standard_LRS --kind StorageV2 \
  --min-tls-version TLS1_2 --allow-blob-public-access false
az storage container create --name tfstate --account-name $STATE_SA --auth-mode login
```

Then:

1. Put `$STATE_RG`, `$STATE_SA` and `tfstate` into both variable groups as
   `TF_STATE_RESOURCE_GROUP`, `TF_STATE_STORAGE_ACCOUNT` and `TF_STATE_CONTAINER`. One
   account and one container serve every environment and stack; each stack has its own
   key.
2. Create the service connection `atlas-azure` and the environments `atlas-dev` and
   `atlas-prod` (section 6); register the six pipelines.

### First bring-up of an environment

Stacks look the shared resources up by name, so they must exist before a dependent stack
plans. In order:

1. **`foundation`** — `infra.yml` (dev on `main`, prod after the approval), or locally as
   in `infra/README.md`. Creates the resource group, monitoring, registry, pull identity
   and the i18n share. Set `PREFIX` in the `atlas-<env>` variable group to the `prefix` of
   the tfvars: that is how `deploy-api` names the registry.
2. **`web-app`** and **`storybook`**, in any order — run their deploy pipelines. Each
   applies its own stack, then deploys the build with the token it just read. The web
   app's `config.json` points at a placeholder until step 5.
3. **`api`** — run `deploy-api.yml`. It builds and pushes `atlas-api:<build id>` first,
   then applies the api stack with that tag, so the image exists before the Container App
   is created. If the first pull fails straight after step 1, wait a minute: role
   assignments propagate asynchronously.
4. Put the web-app stack's `url` output (printed at the end of its apply step) into
   `web_origins` in `infra/env/<env>.tfvars` and merge it. That commit triggers
   `deploy-api.yml` again, which allows the origin; until then the API rejects browser
   calls from the app.
5. Put the api stack's `url` output, with `/api` appended, into `API_BASE_URL` of the
   environment's variable group and run `deploy-web-app.yml` again.

From then on each pipeline owns its stack's plan and apply, and a value changes by editing
`infra/env/<env>.tfvars`. `api_image_tag` there seeds the first revision only: every apply
of the api stack rolls the app to `var.api_image_tag`, and `deploy-api` is the only
pipeline that applies it, always with the build it just pushed. The `Plan_Stacks` job on a
pull request therefore shows the api image reverting to the seed tag — expected, and the
only diff that stack should show. Do not apply `api` by hand with the tfvars value unless
you mean to roll the API back to it. An environment created from the earlier single-root
layout moves into the stack states with `terraform state mv` / `import` before the first
stack apply; `infra/stacks/*/main.tf` lists what each stack owns.

## 6. Environments and approvals

Two Azure DevOps environments, **`atlas-dev`** and **`atlas-prod`** (Pipelines →
Environments). Every deployment job binds one of them, and `atlas-prod` carries an
*Approvals* check with the people allowed to ship to production.

The order is fixed: a run deploys to dev, and only a successful dev stage of the **same
run** continues to prod — the same `dist/`, the same image tag, the same stack code with
`prod.tfvars`. There is no separate prod build. What waits at the gate:

| Pipeline | Waits on `atlas-prod` | Look at, before approving |
|---|---|---|
| deploy-web-app, deploy-storybook | `Deploy_Prod` | the site on dev |
| deploy-api | `Deploy_Prod` | dev's `/healthz` and `/swagger` |
| infra | `Apply_Prod` | the `Plan_Prod` stage log — the PR plan was the review artefact |

`publish-packages.yml` has no deployment job and no gate: a `main` build feeds the `ci`
prerelease to the dev feed; a `v*` tag is the release decision.

## 7. The translations store

The API serves and edits translation catalogs as JSON files (`I18nStore`); there is no
database. On Azure those files live on the **Azure Files share `i18n`** in the
environment's storage account (`<prefix><env>st`; quota `i18n_share_quota_gb`, 5 GB by
default), both created by `foundation`. The api stack (`container-app` module) reads the
account by name, registers the share with the Container Apps environment read-write and
mounts it at `/data/i18n`, which is also `I18n__Folder`. The share outlives replicas,
revisions and image rolls, so edits made through the API — and their history — persist.

```
/data/i18n/
├── en.json, de.json, fr.json, …     current catalog per locale  { name, version, entries }
├── _config.json                     default locale + enabled / fallback per locale
├── _history/{code}/{N}.json         one snapshot per version, append-only
└── _audit.jsonl                     one line per mutation
```

**Seeding.** The image bundles `src/Atlas.Api/i18n/*.json` (`en`, `de`, `fr` and
`_config.json`) next to the binary. At startup `I18nSeed.EnsureSeeded` copies them into
`I18n__Folder` **only when that folder holds no catalog** (no `<code>.json`), so a fresh
share starts populated — the log says `Seeded 4 translation files into /data/i18n` — and a
share that already has catalogs is never touched: a new image cannot overwrite a live edit.
`_history/` and `_audit.jsonl` are runtime state and never ship in the image (`Content
Remove` in the `.csproj`; ignored by git). An unwritable folder is logged as a warning, not
fatal: the API runs, and the i18n endpoints serve no locales until the mount is fixed.

The store re-reads the disk on every request, so a file dropped onto the share shows up on
the next `GET /api/i18n/locales` without a restart (section 9).

## 8. Local equivalents

Every pipeline step runs on a laptop. From the repo root unless noted.

```bash
# web — the static builds (from web/)
pnpm build:packages           # tsc every package + slice → its dist/ (ESM + .d.ts)
pnpm build:app                # Vite → apps/atlas/dist/ (config.json comes from public/)
pnpm build:storybook          # → packages/core/storybook-static/
pnpm preview                  # serve apps/atlas/dist on http://localhost:4173

# api — the image, then the container with a persistent share
docker build -f src/Atlas.Api/Dockerfile -t atlas-api:local .
docker run --rm -p 8080:8080 -v atlas-i18n:/data/i18n \
  -e Cors__Origins__0=http://localhost:4173 atlas-api:local                # the named volume plays the Azure Files share
curl http://localhost:8080/healthz                                        # { "status": "ok" }
curl http://localhost:8080/api/i18n/locales                               # en, de, fr — seeded on the first start

# packages — what publish-packages produces, without a feed
(cd web && pnpm build:packages && pnpm --filter @atlas/platform pack --pack-destination ../out)   # publishConfig applied: main / types / exports → dist/
dotnet pack src/Atlas.Functional.Commands --configuration Release -p:Version=0.1.0-ci.0 --output out/nuget
dotnet pack src/Atlas.Upstream.Contracts   --configuration Release -p:Version=0.1.0-ci.0 --output out/nuget

# the gate
deno lint && deno test -A
dotnet build Atlas.Patterns.sln --configuration Release && dotnet test Atlas.Patterns.sln --configuration Release --no-build

# infra — no Azure access needed
terraform -chdir=infra fmt -check -recursive
for stack in foundation api web-app storybook; do
  terraform -chdir=infra/stacks/$stack init -backend=false && terraform -chdir=infra/stacks/$stack validate
done
```

The image carries no CORS origins (section 2), so the `-e Cors__Origins__0=…` above is
what lets the previewed app call the container; `curl` needs nothing. To point the built
web app at the local container, write `{ "apiBaseUrl": "http://localhost:8080/api" }` into
`web/apps/atlas/dist/config.json` before `pnpm preview` — the same thing the deploy
template does. Plan and apply need Azure credentials: `az login`, `export
ARM_SUBSCRIPTION_ID=…`, then in `infra/stacks/<stack>` a `terraform init` with the three
`-backend-config` values from section 5 plus `key=<env>/<stack>.tfstate`, and
`-var-file=../../env/<env>.tfvars` on every plan and apply (the full sequence is in
`infra/README.md`).

## 9. Runbook

### Rotate a Static Web App deployment token

The token is what `AzureStaticWebApp@0` authenticates with; it is not tied to the service
connection. One token per site per environment, four in total, and none of them is stored
anywhere: each deploy reads its own stack's `api_key` output at deploy time.

1. Reset it on the Static Web App: portal → the SWA → Overview → *Manage deployment
   token* → *Reset token*, or
   `az staticwebapp secrets reset-api-key --name atlas-<env>-app --resource-group atlas-<env>-rg`
   (`atlas-<env>-storybook` for the other site). The old token stops working at once.
2. Run `deploy-web-app.yml` (or `deploy-storybook.yml`) again — re-run its deploy stage or
   queue a new run on `main`. The stage re-applies the stack, which refreshes `api_key`
   from the resource, reads the new value and deploys with it; check the stage goes green.

Nothing to paste. To read the value yourself: in `infra/stacks/web-app` (or `storybook`),
`init` against the state (section 8), `terraform apply -var-file=../../env/<env>.tfvars`
— a no-op apart from the refresh — then `terraform output -raw api_key`.

### Bump the API image

The normal path is a merge to `main` that touches `src/**`, `tests/**` or the api stack:
`deploy-api.yml` builds and pushes `atlas-api:<build id>`, applies the api stack with
`-var api_image_tag=<build id>` on dev, waits for the `atlas-prod` approval, imports the
tag into the prod registry and applies prod. The Container App runs in single-revision mode
with all traffic on the latest revision, so the new revision takes over once its readiness
probe passes.

The stack owns the image reference, so a roll is always a Terraform apply — never
`az containerapp update`, which the next apply would revert. To roll an environment to a
tag by hand — a rollback, or prod to a tag dev has soaked on — re-run the deploy stage of
the earlier `deploy-api.yml` run that produced the tag, or locally:

```bash
az acr repository show-tags --name atlas<env>acr --repository atlas-api --orderby time_desc --top 10
cd infra/stacks/api                       # init against <env>/api.tfstate, section 8
terraform apply -var-file=../../env/<env>.tfvars -var api_image_tag=<tag>
az containerapp revision list --name atlas-<env>-api --resource-group atlas-<env>-rg -o table
curl https://<api fqdn>/healthz
```

A new tag never touches the translations share — it is mounted, not baked in.

### Add a locale on a live environment

No build, no deploy, no restart: a locale is a file on the share.

1. Write `<code>.json` — the code matches `^[a-z]{2}(-[A-Z]{2})?$` — as
   `{ "name": "Español", "entries": { "nav.fundConstruction": "…", … } }`. `version` may
   be omitted (it reads as 1). The keys are those of `src/Atlas.Api/i18n/en.json`; a key
   left out falls back through the fallback chain.
2. Upload it to the `i18n` share: portal → storage account `atlas<env>st` → File shares →
   `i18n` → Upload, or

   ```bash
   az storage file upload --account-name atlas<env>st --share-name i18n \
     --source es.json --path es.json \
     --account-key "$(az storage account keys list --account-name atlas<env>st --resource-group atlas-<env>-rg --query '[0].value' -o tsv)"
   ```

3. Check `curl https://<api fqdn>/api/i18n/locales` lists it — the store re-reads the disk
   per request — and the `LocaleSwitcher` in the app shows it on the next load. With no
   line in `_config.json` the locale is enabled and falls back to the default (`en`); to
   disable it or change its fallback use the **Translations** slice (Locales tab) or
   `PUT /api/i18n/config`. The first edit through the API records the file as version 1
   (`seeded from es.json`), so the trail starts there.
4. To make the locale part of the seed for future environments, add the same file — and a
   line in `_config.json` — under `src/Atlas.Api/i18n/` in the repo. That only affects
   shares that hold no catalog yet; live shares are never re-seeded.
