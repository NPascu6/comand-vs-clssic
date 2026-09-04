# For people. The pipelines never read these: they derive every name from the
# shared convention (registry <prefix><env>acr, resource group <prefix>-<env>-rg),
# so nothing here has to be copied into a variable group.
output "resource_group_name" {
  value = module.resource_group.name
}

output "location" {
  value = module.resource_group.location
}

output "acr_login_server" {
  value = module.registry.login_server
}

output "acr_pull_identity_id" {
  value = module.registry.pull_identity_id
}

output "log_analytics_workspace_id" {
  value = module.monitoring.workspace_id
}

output "storage_account_name" {
  value = module.storage.account_name
}

output "i18n_share_name" {
  value = module.storage.share_name
}
