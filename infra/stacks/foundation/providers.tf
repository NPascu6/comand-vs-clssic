# Credentials and subscription come from the environment: the pipeline's
# service connection sets ARM_*; locally `az login` plus ARM_SUBSCRIPTION_ID.
provider "azurerm" {
  features {}
}
