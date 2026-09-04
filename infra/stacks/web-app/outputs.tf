output "hostname" {
  value = module.site.default_host_name
}

output "url" {
  value = "https://${module.site.default_host_name}"
}

# Deployment token; the deploy pipeline reads it with `terraform output -raw api_key`.
output "api_key" {
  value     = module.site.api_key
  sensitive = true
}
