variable "name" {
  description = "Container app name."
  type        = string
}

variable "environment_name" {
  description = "Container Apps environment name."
  type        = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "log_analytics_workspace_id" {
  description = "Workspace the environment ships container logs to."
  type        = string
}

variable "app_insights_connection_string" {
  type      = string
  sensitive = true
}

variable "image" {
  description = "Full image reference, e.g. <acr>.azurecr.io/atlas-api:<tag>; every apply rolls the app to it."
  type        = string
}

variable "registry_server" {
  description = "Registry login server the image is pulled from."
  type        = string
}

variable "pull_identity_id" {
  description = "User-assigned identity with AcrPull on the registry."
  type        = string
}

variable "cpu" {
  description = "vCPU per replica (0.25 steps)."
  type        = number
  default     = 0.25
}

variable "memory" {
  description = "Memory per replica, e.g. 0.5Gi (must pair with cpu)."
  type        = string
  default     = "0.5Gi"
}

variable "min_replicas" {
  type    = number
  default = 0
}

variable "max_replicas" {
  type    = number
  default = 3
}

variable "cors_origins" {
  description = "Allowed web origins, written as Cors__Origins__0..n."
  type        = list(string)
  default     = []
}

variable "storage_account_name" {
  description = "Storage account holding the i18n share."
  type        = string
}

variable "storage_account_key" {
  type      = string
  sensitive = true
}

variable "share_name" {
  description = "Azure Files share mounted at /data/i18n."
  type        = string
}
