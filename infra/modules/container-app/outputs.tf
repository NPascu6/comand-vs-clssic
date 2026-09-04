output "name" {
  value = azurerm_container_app.this.name
}

output "fqdn" {
  value = azurerm_container_app.this.ingress[0].fqdn
}

output "principal_id" {
  description = "System-assigned identity of the app."
  value       = azurerm_container_app.this.identity[0].principal_id
}

output "environment_id" {
  value = azurerm_container_app_environment.this.id
}
