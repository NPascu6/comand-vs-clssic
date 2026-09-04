# Admin credentials stay off: the API pulls with a managed identity.
resource "azurerm_container_registry" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  admin_enabled       = false
  tags                = var.tags
}

# The pull identity is user-assigned so AcrPull can be granted before the
# container app exists; a system-assigned identity only exists after the app,
# and the app pulls its image on creation.
resource "azurerm_user_assigned_identity" "pull" {
  name                = var.pull_identity_name
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.tags
}

resource "azurerm_role_assignment" "pull" {
  scope                = azurerm_container_registry.this.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.pull.principal_id
  principal_type       = "ServicePrincipal"
}
