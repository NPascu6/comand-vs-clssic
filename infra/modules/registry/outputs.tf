output "id" {
  value = azurerm_container_registry.this.id
}

output "name" {
  value = azurerm_container_registry.this.name
}

output "login_server" {
  value = azurerm_container_registry.this.login_server
}

# Consumers that reference this output wait for the AcrPull grant, so the
# container app is never created before its identity can pull.
output "pull_identity_id" {
  value      = azurerm_user_assigned_identity.pull.id
  depends_on = [azurerm_role_assignment.pull]
}
