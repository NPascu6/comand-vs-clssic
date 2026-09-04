# One state blob per stack and environment, key <env>/<stack>.tfstate, in the
# storage account bootstrapped once per subscription (infra/README.md). Every
# setting arrives at init time through -backend-config; the pipeline passes
# the TF_STATE_* values of the atlas-<env> variable group plus the key.
terraform {
  backend "azurerm" {}
}
