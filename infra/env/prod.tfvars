# Shared values for prod. Every stack loads this file (-var-file ../../env/prod.tfvars)
# and declares every variable in it; a stack reads only what it needs.
env          = "prod"
prefix       = "atlas"
location     = "westeurope"
swa_location = "westeurope"

tags = {
  project    = "atlas"
  managed_by = "terraform"
}

# foundation
acr_sku             = "Standard"
log_retention_days  = 90
i18n_share_quota_gb = 5

# web-app / storybook
swa_sku = "Standard"

# api
api_image_tag    = "latest" # first revision only; deploy-api passes -var api_image_tag=<build id>
api_cpu          = 0.5
api_memory       = "1Gi"
api_min_replicas = 1 # one warm replica
api_max_replicas = 5

# Origins the API accepts browser calls from. Empty on a fresh environment:
# after the web-app stack's first apply put its `url` output here and apply api.
web_origins = []
