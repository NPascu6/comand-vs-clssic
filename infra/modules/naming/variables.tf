variable "prefix" {
  description = "First segment of every name; lowercase letters and digits only."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9]*$", var.prefix))
    error_message = "prefix must be lowercase letters and digits and start with a letter."
  }
}

variable "env" {
  description = "Environment segment (dev, prod); lowercase letters and digits only."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]+$", var.env))
    error_message = "env must be lowercase letters and digits."
  }
}
