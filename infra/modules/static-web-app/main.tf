# Deployed by the pipelines with the SWA CLI and the api_key output; no
# repository binding here so any branch/build can be pushed.
resource "azurerm_static_web_app" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = var.sku
  sku_size            = var.sku
  tags                = var.tags
}
