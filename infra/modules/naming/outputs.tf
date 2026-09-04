output "resource_group" {
  value = "${local.base}-rg"
}

output "log_analytics" {
  value = "${local.base}-log"
}

output "app_insights" {
  value = "${local.base}-appi"
}

output "container_registry" {
  value = "${local.flat}acr"
}

output "acr_pull_identity" {
  value = "${local.base}-acr-pull"
}

output "storage_account" {
  value = "${local.flat}st"
}

output "i18n_share" {
  value = "i18n"
}

output "container_app_environment" {
  value = "${local.base}-cae"
}

output "api" {
  value = "${local.base}-api"
}

output "web_app" {
  value = "${local.base}-app"
}

output "storybook" {
  value = "${local.base}-storybook"
}
