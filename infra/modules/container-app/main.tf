locals {
  port                = 8080
  i18n_volume         = "i18n"
  i18n_mount_path     = "/data/i18n"
  app_insights_secret = "appinsights-connection-string"
}

resource "azurerm_container_app_environment" "this" {
  name                       = var.environment_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  tags                       = var.tags
}

# The Azure Files share registered with the environment; the template below
# mounts it into the container.
resource "azurerm_container_app_environment_storage" "i18n" {
  name                         = local.i18n_volume
  container_app_environment_id = azurerm_container_app_environment.this.id
  account_name                 = var.storage_account_name
  share_name                   = var.share_name
  access_key                   = var.storage_account_key
  access_mode                  = "ReadWrite"
}

resource "azurerm_container_app" "this" {
  name                         = var.name
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  tags                         = var.tags

  # System-assigned is the app's own identity for future grants; the
  # user-assigned one carries AcrPull (see modules/registry).
  identity {
    type         = "SystemAssigned, UserAssigned"
    identity_ids = [var.pull_identity_id]
  }

  registry {
    server   = var.registry_server
    identity = var.pull_identity_id
  }

  secret {
    name  = local.app_insights_secret
    value = var.app_insights_connection_string
  }

  ingress {
    external_enabled = true
    target_port      = local.port
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "api"
      image  = var.image
      cpu    = var.cpu
      memory = var.memory

      env {
        name  = "ASPNETCORE_URLS"
        value = "http://+:${local.port}"
      }

      env {
        name  = "I18n__Folder"
        value = local.i18n_mount_path
      }

      env {
        name        = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        secret_name = local.app_insights_secret
      }

      # Cors__Origins__0, Cors__Origins__1, ... (ASP.NET Core array binding).
      dynamic "env" {
        for_each = { for i, origin in var.cors_origins : tostring(i) => origin }

        content {
          name  = "Cors__Origins__${env.key}"
          value = env.value
        }
      }

      liveness_probe {
        transport        = "HTTP"
        port             = local.port
        path             = "/healthz"
        initial_delay    = 10
        interval_seconds = 10
      }

      readiness_probe {
        transport        = "HTTP"
        port             = local.port
        path             = "/healthz"
        interval_seconds = 5
      }

      volume_mounts {
        name = local.i18n_volume
        path = local.i18n_mount_path
      }
    }

    volume {
      name         = local.i18n_volume
      storage_name = azurerm_container_app_environment_storage.i18n.name
      storage_type = "AzureFile"
    }
  }
}
