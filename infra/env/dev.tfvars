# Shared values for dev. Every stack loads this file (-var-file ../../env/dev.tfvars)
# and declares every variable in it; a stack reads only what it needs.
env          = "dev"
prefix       = "atlas"
location     = "westeurope"
swa_location = "westeurope"

tags = {
  project    = "atlas"
  managed_by = "terraform"
}

# foundation
acr_sku             = "Basic"
log_retention_days  = 30
i18n_share_quota_gb = 5

# web-app / storybook
swa_sku = "Free"

# api
api_image_tag    = "latest" # first revision only; deploy-api passes -var api_image_tag=<build id>
api_cpu          = 0.25
api_memory       = "0.5Gi"
api_min_replicas = 0 # scales to zero when idle
api_max_replicas = 2

# Origins the API accepts browser calls from. Empty on a fresh environment:
# after the web-app stack's first apply put its `url` output here and apply api.
web_origins = []
