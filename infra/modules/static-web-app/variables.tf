variable "name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  description = "Static Web Apps run in a fixed set of regions (westeurope, eastus2, centralus, westus2, eastasia)."
  type        = string
}

variable "sku" {
  description = "Free or Standard."
  type        = string
  default     = "Free"

  validation {
    condition     = contains(["Free", "Standard"], var.sku)
    error_message = "sku must be Free or Standard."
  }
}

variable "tags" {
  type    = map(string)
  default = {}
}
