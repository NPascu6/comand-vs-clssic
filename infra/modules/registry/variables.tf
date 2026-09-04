variable "name" {
  description = "Registry name: 5-50 alphanumeric characters, globally unique."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{5,50}$", var.name))
    error_message = "Registry names are 5-50 lowercase alphanumeric characters."
  }
}

variable "pull_identity_name" {
  description = "Name of the user-assigned identity granted AcrPull."
  type        = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "sku" {
  description = "Basic, Standard or Premium."
  type        = string
  default     = "Basic"
}

variable "tags" {
  type    = map(string)
  default = {}
}
