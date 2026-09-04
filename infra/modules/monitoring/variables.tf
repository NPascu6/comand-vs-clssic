variable "workspace_name" {
  description = "Log Analytics workspace name."
  type        = string
}

variable "app_insights_name" {
  description = "Application Insights name."
  type        = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "retention_in_days" {
  description = "Log Analytics retention."
  type        = number
  default     = 30
}

variable "tags" {
  type    = map(string)
  default = {}
}
