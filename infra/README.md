# Atlas infrastructure

Terraform for the Azure resources behind the Atlas deployables. **One stack per
deployable unit**, each with its own state and its own plan/apply inside that
unit's deploy pipeline. Nothing here builds or deploys application code; that
is the job of the pipelines under `.azure-pipelines/`.

## Why one stack per unit

Every deployable (web app, storybook, API) has to be developed, deployed and
rolled back on its own. If all of them sat in one root module, every apply
would plan the whole environment, a broken change in one unit would block the
others, and every pipeline would need to hold the same state lock. So:

- each unit owns a stack under `stacks/<unit>` with its own state blob
  (`<env>/<unit>.tfstate`), applied only by that unit's pipeline;
- stacks share nothing but a naming convention (`modules/naming`) and the
  per-environment values in `env/<env>.tfvars`;
- what a stack needs from another it reads **by name** through data sources,
  never through remote state, so a stack never depends on another stack's
  state file or output layout;
- `foundation` holds the pieces that are shared by definition (resource
  group, monitoring, registry, i18n share) and changes rarely.

```
infra/
├── env/
│   ├── dev.tfvars            shared values for dev  (every stack loads this file)
│   └── prod.tfvars           shared values for prod
├── modules/
│   ├── naming/               the names every stack agrees on (no resources)
│   ├── resource-group/
│   ├── monitoring/           Log Analytics workspace + workspace-based App Insights
│   ├── registry/             Azure Container Registry (admin disabled) + the pull identity with AcrPull
│   ├── storage/              storage account + Azure Files share "i18n"
│   ├── container-app/        Container Apps environment + the API app (ingress 8080, /healthz probes, i18n mount)
│   └── static-web-app/       one Azure Static Web App
└── stacks/
    ├── foundation/           resource group, monitoring, registry + pull identity, storage + i18n share
    ├── api/                  Container Apps environment + the API container app
    ├── web-app/              Static Web App "app"
    └── storybook/            Static Web App "storybook"
```

Every stack has the same files: `backend.tf` (empty `backend "azurerm" {}`,
settings via `-backend-config`), `versions.tf` (terraform >= 1.9, azurerm
~> 4.0), `providers.tf`, `variables.tf`, `main.tf`, `outputs.tf` and a
committed `.terraform.lock.hcl`.

## Stacks

| Stack | Creates | Reads from foundation (by name) | Applied by | State key |
|---|---|---|---|---|
| `foundation` | `<prefix>-<env>-rg`, Log Analytics, App Insights, ACR + pull identity (AcrPull), storage account + share `i18n` | nothing | `.azure-pipelines/infra.yml` | `<env>/foundation.tfstate` |
| `api` | Container Apps environment `<prefix>-<env>-cae`, container app `<prefix>-<env>-api` | resource group, ACR, pull identity, Log Analytics, App Insights, storage account (key for the share mount) | `.azure-pipelines/deploy-api.yml` | `<env>/api.tfstate` |
| `web-app` | Static Web App `<prefix>-<env>-app` | resource group | `.azure-pipelines/deploy-web-app.yml` | `<env>/web-app.tfstate` |
| `storybook` | Static Web App `<prefix>-<env>-storybook` | resource group | `.azure-pipelines/deploy-storybook.yml` | `<env>/storybook.tfstate` |

The npm / NuGet packages have no stack: their feeds live in Azure DevOps, not
in the subscription.

### What the API container gets

| Setting | Value | Where it comes from |
|---|---|---|
| `ASPNETCORE_URLS` | `http://+:8080` | `container-app` module |
| `I18n__Folder` | `/data/i18n` | `container-app` module; the Azure Files share `i18n` is mounted there |
| `Cors__Origins__0..n` | the `web_origins` list | `env/<env>.tfvars` |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | App Insights connection string | secret on the app, read from the foundation App Insights |
| liveness / readiness | `GET /healthz` on 8080 | `container-app` module |
| image | `<acr>.azurecr.io/atlas-api:<api_image_tag>` | `api_image_tag`; `deploy-api` passes the build id |
| replicas | `api_min_replicas` .. `api_max_replicas` | `env/<env>.tfvars` |

The image is pulled with the **user-assigned** identity that `foundation`
grants `AcrPull`. A system-assigned identity is also enabled on the app for
future grants, but it cannot be used for the first pull: it only exists once
the app is created, and the app pulls its image during creation.

## Naming convention

`modules/naming` turns `prefix` + `env` into every name; all stacks use it,
which is what lets them find each other's resources without shared state.
The registry and storage account drop the hyphens because Azure does not
allow them there, and both are globally unique names: pick a `prefix` unique
to your organisation if `atlas` is taken.

| Resource | Name | dev example |
|---|---|---|
| resource group | `<prefix>-<env>-rg` | `atlas-dev-rg` |
| Log Analytics | `<prefix>-<env>-log` | `atlas-dev-log` |
| App Insights | `<prefix>-<env>-appi` | `atlas-dev-appi` |
| container registry | `<prefix><env>acr` | `atlasdevacr` |
| pull identity | `<prefix>-<env>-acr-pull` | `atlas-dev-acr-pull` |
| storage account | `<prefix><env>st` | `atlasdevst` |
| Azure Files share | `i18n` | `i18n` |
| Container Apps environment | `<prefix>-<env>-cae` | `atlas-dev-cae` |
| API container app | `<prefix>-<env>-api` | `atlas-dev-api` |
| Static Web App (app) | `<prefix>-<env>-app` | `atlas-dev-app` |
| Static Web App (storybook) | `<prefix>-<env>-storybook` | `atlas-dev-storybook` |

Everything carries the `tags` variable plus `environment = <env>`.

## Variables

All values for an environment live in one file, `env/<env>.tfvars`, and every
stack loads it (`-var-file ../../env/<env>.tfvars`). Terraform warns on every
plan about a var-file value that the root module does not declare, so **every
stack declares the whole set**: `variables.tf` is identical in all four stacks
and a stack simply reads only what it needs. To add a knob, add it to both
tfvars files and to every stack's `variables.tf`.

| Variable | dev | prod | Read by | Notes |
|---|---|---|---|---|
| `env` | `dev` | `prod` | all | second segment of every name |
| `prefix` | `atlas` | `atlas` | all | first segment of every name; must make the registry and storage account names unique |
| `location` | `westeurope` | `westeurope` | foundation, api | region for everything except the static web apps |
| `swa_location` | `westeurope` | `westeurope` | web-app, storybook | Static Web Apps only run in westeurope, eastus2, centralus, westus2, eastasia |
| `tags` | `project`, `managed_by` | same | all | `environment` is merged in automatically |
| `acr_sku` | `Basic` | `Standard` | foundation | |
| `log_retention_days` | `30` | `90` | foundation | Log Analytics retention |
| `i18n_share_quota_gb` | `5` | `5` | foundation | size of the translations share |
| `swa_sku` | `Free` | `Standard` | web-app, storybook | |
| `api_image_tag` | `latest` | `latest` | api | seed for the first revision; `deploy-api` overrides it with `-var api_image_tag=<build id>` (a `-var` after the `-var-file` wins) |
| `api_cpu` / `api_memory` | `0.25` / `0.5Gi` | `0.5` / `1Gi` | api | Container Apps only accepts matching cpu/memory pairs |
| `api_min_replicas` / `api_max_replicas` | `0` / `2` | `1` / `5` | api | min 0 scales to zero when idle |
| `web_origins` | `[]` | `[]` | api | origins the API accepts browser calls from; set to the web-app stack's `url` output after its first apply |

Backend values (`resource_group_name`, `storage_account_name`,
`container_name`, `key`) are not variables: they go through `-backend-config`
so the same code initialises against any state account.

## Outputs

| Stack | Outputs |
|---|---|
| `foundation` | `resource_group_name`, `location`, `acr_login_server`, `acr_pull_identity_id`, `log_analytics_workspace_id`, `storage_account_name`, `i18n_share_name` |
| `api` | `fqdn`, `url` (the web app's `config.json` `apiBaseUrl` is `<url>/api`) |
| `web-app`, `storybook` | `hostname`, `url`, `api_key` (sensitive; the Static Web App deployment token) |

The foundation outputs are for people; the pipelines never read them. They
derive every name from the same convention (`PREFIX` in the variable group must
equal `prefix` in `infra/env/*.tfvars`), e.g. the registry `<prefix><env>acr`.
No stack reads another stack's outputs.

## Prerequisites

- Terraform >= 1.9 (the pipeline template installs 1.16.0; each stack's
  `.terraform.lock.hcl` pins the azurerm provider and is committed).
- An Azure subscription and a service principal (the `atlas-azure` service
  connection in Azure DevOps) with **Contributor** on the subscription and the
  right to create role assignments (**User Access Administrator** or
  **Role Based Access Control Administrator**), because `foundation` assigns
  `AcrPull`.
- Locally: `az login`, then `export ARM_SUBSCRIPTION_ID=<subscription id>`.
  The provider reads credentials from the environment; nothing is committed.

## Bootstrap the state storage (once per subscription)

Terraform state is kept in a blob container. Create it by hand once; it is the
only resource that Terraform does not manage.

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

Give the pipeline service principal **Storage Blob Data Contributor** on the
container (or let it read the account key: Contributor already allows
`listKeys`). Put `$STATE_RG`, `$STATE_SA` and `tfstate` into both variable
groups as `TF_STATE_RESOURCE_GROUP`, `TF_STATE_STORAGE_ACCOUNT` and
`TF_STATE_CONTAINER`. One account and one container serve every environment
and stack; each stack has its own blob, `<env>/<stack>.tfstate`, which
`init` creates on first use.

## Run a stack locally

```bash
cd infra/stacks/web-app                 # any stack
ENV=dev

terraform init \
  -backend-config="resource_group_name=$STATE_RG" \
  -backend-config="storage_account_name=$STATE_SA" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=$ENV/web-app.tfstate"

terraform plan  -var-file=../../env/$ENV.tfvars -out=$ENV.tfplan
terraform apply $ENV.tfplan
terraform output                        # -raw api_key for the sensitive one
```

Always pass the var-file: the stacks have no defaults for the
environment-specific values, so a plan without it prompts for every variable.
Without Azure access you can still check the code:

```bash
cd infra && terraform fmt -check -recursive
for stack in foundation api web-app storybook; do
  (cd stacks/$stack && terraform init -backend=false && terraform validate)
done
```

## First bring-up of an environment

Stacks look the shared resources up by name, so they must exist before a
dependent stack plans. Apply order for a fresh environment:

1. **`foundation`** (`infra.yml`, or locally as above). Creates the resource
   group, monitoring, registry, pull identity and the i18n share. Nothing to
   copy anywhere: the deploy pipelines address the registry as
   `$(PREFIX)<env>acr`, so `PREFIX` in the `atlas-<env>` variable group is the
   only value that must match `prefix` in `infra/env/<env>.tfvars`.
2. **`web-app`** and **`storybook`**, in any order or in parallel: run their
   deploy pipelines. Each applies its own stack, then deploys the build with
   the token it just read.
3. **`api`**: run `deploy-api.yml`. It builds and pushes
   `atlas-api:<build id>` first, then applies the api stack with that tag, so
   the image exists in the registry before the container app is created. If
   the first pull fails straight after step 1, wait a minute: role assignments
   propagate asynchronously.
4. Put the web-app stack's `url` output into `web_origins` in
   `env/<env>.tfvars` and let `deploy-api` apply again (the CORS list is part
   of the api stack). Until then the API rejects browser calls from the app.

If an environment was created from the previous single-root layout, move its
resources into the stack states (`terraform state mv` / `import`) before the
first stack apply; `stacks/*/main.tf` lists what each stack expects to own.

## How the pipelines apply the stacks

Every Terraform step goes through `.azure-pipelines/templates/terraform.yml`,
which takes a `stack` and an `env`: it works in `infra/stacks/<stack>`,
initialises the backend from the `TF_STATE_*` variables with the key
`<env>/<stack>.tfstate`, passes `-var-file ../../env/<env>.tfvars`, and
exposes plan / apply / output steps. Plan and apply run inside `AzureCLI@2`
on the `atlas-azure` service connection, which hands its identity to the
provider and the backend through `ARM_*` variables.

| Pipeline | Terraform it runs |
|---|---|
| `azure-pipelines.yml` (CI gate, PRs and `main`) | `terraform fmt -check` + `init -backend=false` + `validate` for all four stacks; no Azure access |
| `infra.yml` (triggered by `infra/**`) | `foundation` only: plan on pull requests, apply dev on `main`, apply prod behind the `atlas-prod` approval. Pull requests also get a **plan of every stack**, so a change to a module or a tfvars file shows what it does to every unit before merge |
| `deploy-web-app.yml` | Build → per environment: apply `web-app`, read `terraform output -raw api_key` into a secret pipeline variable, deploy `dist/` with it |
| `deploy-storybook.yml` | same with the `storybook` stack and `storybook-static/` |
| `deploy-api.yml` | build/test, docker build + push `atlas-api:$(Build.BuildId)`, apply `api` with `-var api_image_tag=$(Build.BuildId)`; the stack owns the image reference, there is no separate `az containerapp update` |

The Static Web App tokens are therefore never stored anywhere: each deploy
reads its own stack's output at deploy time.

### Who owns the running image

The api stack. Every apply rolls the app to `var.api_image_tag`, and
`deploy-api` is the only pipeline that applies it, always with the build it
just pushed. The `api_image_tag` in `env/<env>.tfvars` is only the seed for
the first revision, which is why the "plan every stack" job on a pull request
shows the api image changing to the seed tag: that line is expected and is
the only diff it should show for the api stack. Do not apply the api stack
from `infra.yml` or by hand with the tfvars value unless you mean to roll the
API back to that tag.

## Adding a deployable unit

1. Add its names to `modules/naming/outputs.tf`.
2. Copy the stack that looks most like it (`web-app` for a static site, `api`
   for a container) to `stacks/<unit>`, change `main.tf` and `outputs.tf`;
   `backend.tf`, `versions.tf` and `providers.tf` are the same everywhere.
3. New knobs go into both `env/*.tfvars` and every stack's `variables.tf`.
4. Give it a deploy pipeline that calls `templates/terraform.yml` with
   `stack: <unit>` and applies it before deploying the artefact, and add the
   stack to the root CI validate job and to the "plan every stack" job in
   `infra.yml`.
5. Run the local checks above. `init` creates the `<env>/<unit>.tfstate` blob
   on the first real run; nothing else needs bootstrapping.

Resources that belong to an existing unit go into that unit's module; anything
several units need goes into `foundation` and is read by name from the others.
