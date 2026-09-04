# Azure DevOps pipelines

One CI gate plus one pipeline per deployable unit. The gate proves that every
unit builds, tests and lints; the per-unit pipelines deploy — and only the unit
whose sources changed. Each deploy pipeline also owns exactly one Terraform
stack (`infra/stacks/<stack>`) and applies it before it deploys, so a unit's
infrastructure and its code ship together and nothing else has to run first.

## Pipelines

| Pipeline | Runs on | Stack | What it does |
| --- | --- | --- | --- |
| `/azure-pipelines.yml` | pull requests, pushes to `main` | — | The gate, four parallel jobs. **Web**: `pnpm install --frozen-lockfile`, design-tokens check, `build:packages`, `typecheck`, `build:app`, `build:storybook`; publishes `web-app` and `storybook` artefacts. **Api**: `dotnet build`, `dotnet test` (trx results published), `dotnet pack` → `nuget` artefact. **Lint**: `deno lint` + `deno test -A` (the same gate as `.github/workflows/deno.yml`). **Infra**: `terraform fmt -check` + `validate` for each of the four stacks (a matrix). Nothing deploys. |
| `deploy-web-app.yml` | `main`; paths `web/apps/atlas`, `web/packages`, `web/slices`, `infra/stacks/web-app`, `infra/modules`, `infra/env` | `web-app` | `pnpm build:packages` + `pnpm build:app` → artefact `web-app`. Per environment: `terraform apply` of the `web-app` stack, then the artefact goes to Static Web App **app** with the deployment token the stack outputs (`api_key`). `config.json` is written into the artefact per environment (see below). Dev, then prod. |
| `deploy-storybook.yml` | `main`; paths `web/packages/core`, `web/packages/design-tokens`, `infra/stacks/storybook`, `infra/modules`, `infra/env` | `storybook` | `pnpm build:packages` + `pnpm build:storybook` → artefact `storybook`. Per environment: `terraform apply` of the `storybook` stack, then the artefact goes to Static Web App **storybook** with its `api_key` output. Dev, then prod. |
| `deploy-api.yml` | `main`; paths `src`, `tests`, `infra/stacks/api`, `infra/modules`, `infra/env` | `api` | `dotnet build` + `test`, `docker build` from `src/Atlas.Api/Dockerfile` (repo root as context), push `<prefix>devacr.azurecr.io/atlas-api:<build id>`. Dev: `terraform apply` of the `api` stack with `-var api_image_tag=<build id>`, which rolls the Container App. Prod: `az acr import` of that tag into `<prefix>prodacr`, then the same apply against prod. |
| `publish-packages.yml` | `main` and `v*` tags; paths `web/packages`, `web/slices`, `src` | — | Stamps a version, `pnpm publish -r` every workspace package to the npm feed, `dotnet pack` + `dotnet nuget push` `Atlas.Functional.Commands` and `Atlas.Upstream.Contracts` to the NuGet feed. |
| `infra.yml` | pull requests: `infra/**`; `main`: `infra/stacks/foundation`, `infra/modules`, `infra/env` | `foundation` | Pull request: `terraform plan` of `foundation` (dev) plus a plan of `api`, `web-app` and `storybook` against dev, so a shared module or tfvars change is reviewed for every stack. `main`: apply dev → plan prod → apply prod. |

Every pipeline also triggers on its own YAML file and on the templates it uses,
so a pipeline fix ships with the next run instead of waiting for a source change.

### Path triggers make each unit independent

Azure DevOps evaluates a pipeline's `trigger.paths` against the files in a push.
A change under `web/slices/` runs the web-app deploy and the package publish and
nothing else; a change under `src/` runs the API deploy and the package publish;
a change under `infra/stacks/api/` runs only the API deploy. Only the shared
Terraform code (`infra/modules/`, `infra/env/`) fans out to every pipeline that
applies a stack. Each pipeline builds its unit from scratch in its own job, so
nothing is shared between them at run time except the variable groups. Prod
stages always follow a successful dev stage of the same run and wait for the
`atlas-prod` approval.

### One stack per pipeline

`infra/` is split into four stacks, each with its own state
(`<env>/<stack>.tfstate` in the state storage account) and each applied by
exactly one pipeline. Stacks never read each other's state: they share the
naming convention (`infra/modules/naming`) and look shared resources up by name.

| Stack | Applied by | Creates | Outputs the pipeline uses |
| --- | --- | --- | --- |
| `foundation` | `infra.yml` | `<prefix>-<env>-rg`, `<prefix>-<env>-log` + `<prefix>-<env>-appi`, `<prefix><env>acr` + pull identity `<prefix>-<env>-acr-pull`, `<prefix><env>st` with share `i18n` | none (the others find these by name) |
| `web-app` | `deploy-web-app.yml` | Static Web App `<prefix>-<env>-app` | `api_key` → deployment token |
| `storybook` | `deploy-storybook.yml` | Static Web App `<prefix>-<env>-storybook` | `api_key` → deployment token |
| `api` | `deploy-api.yml` | Container Apps environment `<prefix>-<env>-cae` + app `<prefix>-<env>-api` | none |

The `api` stack owns the running image: `deploy-api` passes
`-var api_image_tag=<build id>` and Terraform rolls the revision. Nothing
changes the Container App outside Terraform.

**Bringing up an environment** is the same pipelines in this order
(`foundation` first because the others look its resources up by name):

1. Bootstrap the state storage account (`infra/README.md`) and fill in the
   variable groups below.
2. `infra.yml` — creates `foundation` (dev on `main`; prod after the approval).
3. `deploy-web-app.yml` and `deploy-storybook.yml`, in any order — each creates
   its Static Web App and deploys. The web app's `config.json` still points at
   a placeholder until step 5.
4. Put the web-app stack's `url` output (printed at the end of its apply step)
   into `web_origins` in `infra/env/<env>.tfvars` and merge it. That commit
   triggers `deploy-api.yml`, which pushes the image, creates the Container App
   and allows that origin.
5. Put the api stack's `url` output, with `/api` appended, into `API_BASE_URL`
   of the environment's variable group and run `deploy-web-app.yml` again.

After that, any order: every pipeline applies its own stack on every run and a
no-op apply is cheap.

### Build once, deploy anywhere

The web app reads `/config.json` at boot (`loadRuntimeConfig` in
`@atlas/platform`). The deploy template writes `{ "apiBaseUrl": "<API_BASE_URL>" }`
into the downloaded artefact before uploading it, so the same build goes to dev
and prod. The API takes its settings as environment variables on the Container
App (`ASPNETCORE_URLS`, `Cors__Origins__0..n`, `I18n__Folder`) — those are
set by the `api` stack (`infra/`), not by the pipeline. The API image is built
once, pushed to the dev registry and imported into the prod registry by digest.

### Versions

| Build | Version | npm dist-tag | Feeds from |
| --- | --- | --- | --- |
| push to `main` | `0.1.0-ci.<Build.BuildId>` | `ci` | variable group `atlas-dev` |
| tag `vX.Y.Z` | `X.Y.Z` | `latest` | variable group `atlas-prod` |

Every workspace package and both NuGet packages get the same version in one run,
so `workspace:*` and project references resolve to that version in the published
manifests. Point both groups at one feed if you only have one.

## Templates (`templates/`)

| Template | Steps |
| --- | --- |
| `setup-pnpm.yml` | Node 24.x, pnpm 11, cached pnpm store, `pnpm install --frozen-lockfile` in `web/`. |
| `setup-dotnet.yml` | The .NET SDK from `global.json`. |
| `setup-deno.yml` | Deno `v1.46.3` on `PATH`. |
| `terraform.yml` | Parameters `stack` (`foundation` \| `api` \| `web-app` \| `storybook`), `env` (`dev` \| `prod`), `action` (`validate` \| `plan` \| `apply`), `vars` (extra `-var` arguments) and `outputs` (a list of `{ name, variable, secret }`). Works in `infra/stacks/<stack>` with `-var-file ../../env/<env>.tfvars` and state key `<env>/<stack>.tfstate`. `validate` needs no Azure access; `plan`/`apply` run inside `AzureCLI@2` on `atlas-azure`, configure the azurerm backend from the `TF_STATE_*` variables, then copy each requested output (`terraform output -raw <name>`) into a variable of the job, secret when asked. |
| `deploy-static-web-app.yml` | Download an artefact, optionally write `config.json`, `AzureStaticWebApp@0` with `skip_app_build` and the deployment token passed in. |

## One-time setup in Azure DevOps

### Service connection `atlas-azure`

An **Azure Resource Manager** service connection, workload identity federation
recommended (a client-secret connection works too — `terraform.yml` handles
either). Its identity needs:

- `Contributor` on the subscription: the `foundation` stack creates the
  resource groups, and every deploy pipeline applies a stack;
- the right to create role assignments (`User Access Administrator` or
  `Role Based Access Control Administrator`): `foundation` grants `AcrPull` to
  the pull identity;
- `Storage Blob Data Contributor` on the Terraform state storage account.

`Contributor` on the registries already covers `docker push` and
`az acr import`.

### Environments `atlas-dev` and `atlas-prod`

Create both under Pipelines → Environments. On **atlas-prod** add an
*Approvals* check with the people allowed to ship to production. Every
deployment job that targets it waits there: `Deploy_Prod` in the three deploy
pipelines and `Apply_Prod` in `infra.yml` (review the `Plan_Prod` log first).

### Variable groups `atlas-dev` and `atlas-prod`

Two groups under Pipelines → Library with the **same variable names** and
per-environment values. Never commit any of these values; the placeholders
below are the shape, not real names. Resource names are not variables: every
pipeline derives them from `PREFIX` and the environment with the naming
convention above (`<prefix>-<env>-rg`, `<prefix><env>acr`, …), and the
Static Web App deployment tokens come out of the stacks at run time, so there
are no secrets to copy.

| Variable | Used by | Value (placeholder) |
| --- | --- | --- |
| `PREFIX` | deploy-api | First segment of every resource name, e.g. `atlas`; must equal `prefix` in `infra/env/<env>.tfvars`. Names the registries `<prefix>devacr` / `<prefix>prodacr` |
| `API_BASE_URL` | deploy-web-app | `https://<api fqdn>/api` — the api stack's `url` output plus `/api`; becomes `apiBaseUrl` in `config.json`. Set after the api stack's first apply |
| `NPM_FEED_URL` | publish-packages | `https://pkgs.dev.azure.com/<org>/<project>/_packaging/<feed>/npm/registry/` |
| `NUGET_FEED_URL` | publish-packages | `https://pkgs.dev.azure.com/<org>/<project>/_packaging/<feed>/nuget/v3/index.json` |
| `TF_STATE_RESOURCE_GROUP` | every stack apply | Resource group of the Terraform state storage account |
| `TF_STATE_STORAGE_ACCOUNT` | every stack apply | The state storage account (the azurerm backend); one account serves both environments and all stacks |
| `TF_STATE_CONTAINER` | every stack apply | Blob container for the state, e.g. `tfstate` |

Set at run time, not in a group: `SWA_DEPLOYMENT_TOKEN` (secret) is the
`api_key` output of the `web-app` or `storybook` stack, exported by
`terraform.yml` for the deploy step that follows it in the same job.

The Container App pulls from the registry with the user-assigned identity the
`foundation` stack grants `AcrPull`; the pipeline only pushes the image and
applies the `api` stack.

### Feeds

Azure Artifacts feeds in the same organisation. Give the project's build service
identity (`<project> Build Service (<org>)`) the **Contributor** role on the
feed. `npmAuthenticate@0` and `NuGetAuthenticate@1` then sign in with the
pipeline's own token — no personal access token anywhere.

### Registering the pipelines

Pipelines → New pipeline → *Existing Azure Pipelines YAML file*, once per file
(six pipelines). For a GitHub repository the `pr:` triggers in
`azure-pipelines.yml` and `infra.yml` are honoured as written. For an Azure
Repos repository, pull-request validation is a branch policy instead: on `main`
add a *Build validation* policy for `azure-pipelines.yml` (and one for
`infra.yml` with path filter `/infra/*`).

## Run locally what CI runs

```bash
# web (from web/)
pnpm install --frozen-lockfile
pnpm --filter @atlas/design-tokens check
pnpm build:packages && pnpm typecheck && pnpm build:app && pnpm build:storybook

# api (from the repo root)
dotnet build Atlas.Patterns.sln --configuration Release
dotnet test Atlas.Patterns.sln --configuration Release --no-build
dotnet pack src/Atlas.Functional.Commands --configuration Release -p:Version=0.1.0-ci.0 --output out/nuget
dotnet pack src/Atlas.Upstream.Contracts --configuration Release -p:Version=0.1.0-ci.0 --output out/nuget
docker build -f src/Atlas.Api/Dockerfile -t atlas-api:local .

# lint + web tests (from the repo root)
deno lint
deno test -A

# infra (from the repo root)
terraform -chdir=infra fmt -check -recursive
for stack in foundation api web-app storybook; do
  terraform -chdir=infra/stacks/$stack init -backend=false && terraform -chdir=infra/stacks/$stack validate
done
```

Plan and apply need the state backend and Azure credentials; run them through
the pipeline that owns the stack, or locally after `az login` with the same
`-backend-config` values and `-var-file` `templates/terraform.yml` passes.
