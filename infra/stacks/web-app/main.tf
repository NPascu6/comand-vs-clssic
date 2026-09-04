# The "app" Static Web App. Only the resource group comes from the foundation
# stack, looked up by name; the deploy pipeline reads api_key to push builds.
module "naming" {
  source = "../../modules/naming"

  prefix = var.prefix
  env    = var.env
}

locals {
  tags = merge(var.tags, { environment = var.env })
}

data "azurerm_resource_group" "this" {
  name = module.naming.resource_group
}

module "site" {
  source = "../../modules/static-web-app"

  name                = module.naming.web_app
  resource_group_name = data.azurerm_resource_group.this.name
  location            = var.swa_location
  sku                 = var.swa_sku
  tags                = local.tags
}
