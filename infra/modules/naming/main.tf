# Names every stack agrees on. Stacks never share state: the api, web-app and
# storybook stacks look the foundation resources up by these names.
locals {
  base = "${var.prefix}-${var.env}" # <prefix>-<env>-<unit>
  flat = "${var.prefix}${var.env}"  # registry / storage account names allow no hyphens
}
