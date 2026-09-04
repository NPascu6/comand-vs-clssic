# Every stack loads env/<env>.tfvars, so every stack declares the whole set:
# a value in a var-file without a matching declaration warns on each plan.
# This file is identical in all stacks; a stack reads only what it needs.

variable "env" {
  description = "Environment name (dev, prod); second segment of every resource name and the state key prefix."
  type        = string
}

variable "prefix" {
  description = "First segment of every name; the registry and storage account names derive from it, so it must be unique to your organisation."
  type        = string
}

variable "location" {
  description = "Region for everything except the static web apps."
  type        = string
}

variable "swa_location" {
  description = "Static Web Apps region (westeurope, eastus2, centralus, westus2 or eastasia)."
  type        = string
}

variable "tags" {
  description = "Tags applied to every resource; environment is added automatically."
  type        = map(string)
  default     = {}
}

# foundation

variable "acr_sku" {
  description = "Container registry sku."
  type        = string
}

variable "log_retention_days" {
  description = "Log Analytics retention."
  type        = number
}

variable "i18n_share_quota_gb" {
  description = "Size of the Azure Files share holding the translation catalogs."
  type        = number
}

# web-app / storybook

variable "swa_sku" {
  description = "Static Web App sku: Free or Standard."
  type        = string
}

# api

variable "api_image_tag" {
  description = "Tag of the atlas-api image the app runs; deploy-api passes the build id with -var."
  type        = string
}

variable "api_cpu" {
  description = "vCPU per API replica."
  type        = number
}

variable "api_memory" {
  description = "Memory per API replica (must pair with api_cpu)."
  type        = string
}

variable "api_min_replicas" {
  type = number
}

variable "api_max_replicas" {
  type = number
}

variable "web_origins" {
  description = "Web origins the API accepts browser calls from (the web-app stack's url output)."
  type        = list(string)
  default     = []
}
