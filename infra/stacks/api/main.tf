# The API: a Container Apps environment and the atlas-api container app.
# Everything it needs from the foundation stack is looked up by name, so this
# stack plans and applies on its own (deploy-api.yml) once foundation exists.
module "naming" {
  source = "../../modules/naming"

  prefix = var.prefix
  env    = var.env
}

locals {
  tags  = merge(var.tags, { environment = var.env })
  image = "${data.azurerm_container_registry.this.login_server}/atlas-api:${var.api_image_tag}"
}

data "azurerm_resource_group" "this" {
  name = module.naming.resource_group
}

data "azurerm_container_registry" "this" {
  name                = module.naming.container_registry
  resource_group_name = data.azurerm_resource_group.this.name
}

data "azurerm_user_assigned_identity" "pull" {
  name                = module.naming.acr_pull_identity
  resource_group_name = data.azurerm_resource_group.this.name
}

data "azurerm_log_analytics_workspace" "this" {
  name                = module.naming.log_analytics
  resource_group_name = data.azurerm_resource_group.this.name
}

data "azurerm_application_insights" "this" {
  name                = module.naming.app_insights
  resource_group_name = data.azurerm_resource_group.this.name
}

data "azurerm_storage_account" "this" {
  name                = module.naming.storage_account
  resource_group_name = data.azurerm_resource_group.this.name
}

module "api" {
  source = "../../modules/container-app"

  name                           = module.naming.api
  environment_name               = module.naming.container_app_environment
  resource_group_name            = data.azurerm_resource_group.this.name
  location                       = var.location
  log_analytics_workspace_id     = data.azurerm_log_analytics_workspace.this.id
  app_insights_connection_string = data.azurerm_application_insights.this.connection_string
  image                          = local.image
  registry_server                = data.azurerm_container_registry.this.login_server
  pull_identity_id               = data.azurerm_user_assigned_identity.pull.id
  cpu                            = var.api_cpu
  memory                         = var.api_memory
  min_replicas                   = var.api_min_replicas
  max_replicas                   = var.api_max_replicas
  cors_origins                   = var.web_origins
  storage_account_name           = data.azurerm_storage_account.this.name
  storage_account_key            = data.azurerm_storage_account.this.primary_access_key
  share_name                     = module.naming.i18n_share
  tags                           = local.tags
}
