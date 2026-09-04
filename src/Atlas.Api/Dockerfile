# Atlas.Api — build from the repo root:
#   docker build -f src/Atlas.Api/Dockerfile -t atlas-api .
#
# Stage 1 restores from the project files alone, so the NuGet layer is reused
# until a .csproj changes; the sources are copied only after that.
# global.json stays out on purpose: it pins the local SDK feature band, while
# the image ships its own 10.0 SDK.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Atlas.Patterns.sln Directory.Build.props ./
COPY src/Atlas.Api/Atlas.Api.csproj src/Atlas.Api/
COPY src/Atlas.Functional.Commands/Atlas.Functional.Commands.csproj src/Atlas.Functional.Commands/
COPY src/Atlas.Upstream.Contracts/Atlas.Upstream.Contracts.csproj src/Atlas.Upstream.Contracts/
RUN dotnet restore src/Atlas.Api/Atlas.Api.csproj

COPY src/ src/
RUN dotnet publish src/Atlas.Api/Atlas.Api.csproj -c Release --no-restore -o /app

# Stage 2: ASP.NET Core runtime only, non-root, one port. Translations live on
# the volume mounted at /data/i18n and are seeded from the bundled catalogs on
# the first start. No HEALTHCHECK: the image has neither curl nor wget, and
# Azure Container Apps runs its own probes against GET /healthz.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
RUN mkdir -p /data/i18n && chown app:app /data/i18n
USER app
# The base image pre-sets ASPNETCORE_HTTP_PORTS=8080; cleared so URLS wins without a startup warning.
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_HTTP_PORTS= \
    I18n__Folder=/data/i18n
EXPOSE 8080
ENTRYPOINT ["dotnet", "Atlas.Api.dll"]
