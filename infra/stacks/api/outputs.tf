output "fqdn" {
  value = module.api.fqdn
}

# The web app's config.json apiBaseUrl is "<url>/api".
output "url" {
  value = "https://${module.api.fqdn}"
}
