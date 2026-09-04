variable "name" {
  description = "Storage account name: 3-24 lowercase alphanumeric characters, globally unique."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{3,24}$", var.name))
    error_message = "Storage account names are 3-24 lowercase alphanumeric characters."
  }
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "share_name" {
  description = "Azure Files share mounted into the API."
  type        = string
  default     = "i18n"
}

variable "share_quota_gb" {
  type    = number
  default = 5
}

variable "replication_type" {
  description = "LRS, ZRS, GRS ..."
  type        = string
  default     = "LRS"
}

variable "tags" {
  type    = map(string)
  default = {}
}
