# What every other stack builds on: the resource group, monitoring, the
# registry with its pull identity and the storage account with the i18n share.
# The other stacks look these up by name (modules/naming), never by state.
module "naming" {
  source = "../../modules/naming"

  prefix = var.prefix
  env    = var.env
}

locals {
  tags = merge(var.tags, { environment = var.env })
}

module "resource_group" {
  source = "../../modules/resource-group"

  name     = module.naming.resource_group
  location = var.location
  tags     = local.tags
}

module "monitoring" {
  source = "../../modules/monitoring"

  workspace_name      = module.naming.log_analytics
  app_insights_name   = module.naming.app_insights
  resource_group_name = module.resource_group.name
  location            = var.location
  retention_in_days   = var.log_retention_days
  tags                = local.tags
}

module "registry" {
  source = "../../modules/registry"

  name                = module.naming.container_registry
  pull_identity_name  = module.naming.acr_pull_identity
  resource_group_name = module.resource_group.name
  location            = var.location
  sku                 = var.acr_sku
  tags                = local.tags
}

module "storage" {
  source = "../../modules/storage"

  name                = module.naming.storage_account
  share_name          = module.naming.i18n_share
  resource_group_name = module.resource_group.name
  location            = var.location
  share_quota_gb      = var.i18n_share_quota_gb
  tags                = local.tags
}
