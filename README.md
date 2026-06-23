# OpMon Grafana Datasource

OpMon Datasource Plugin for Grafana.

OpMon is a monitoring solution developed by OpServices. Learn more at:

https://www.opservices.com

This datasource plugin allows Grafana to access and visualize monitoring data collected by OpMon.

## Requirements

Before building and signing the plugin, ensure you have:

- Grafana 11.x or newer
- Docker
- A Grafana Access Policy Token with plugin signing permissions
- Internet access to download project dependencies during the build process

> [!NOTE]
> This plugin should be signed before being loaded by Grafana.
>
> If you do not want to sign the plugin, Grafana can be configured to allow unsigned plugins by adding the plugin ID to the `allow_loading_unsigned_plugins` setting in `grafana.ini`.
>
> Example:
>
> ```ini
> [plugins]
> allow_loading_unsigned_plugins = opservicesti-opmon-datasource
> ```

## Installation

### 1. Configure Environment Variables

```bash
export GRAFANA_ACCESS_POLICY_TOKEN="yourGrafanaAccessPolicyToken"

export ROOT_URLS="https://grafana.example.com"

# Multiple Grafana URLs
export ROOT_URLS="https://grafana.example.com,https://monitor.example.com,https://10.0.0.10"
```

### 2. Create the Builder Dockerfile

Create a file named `Dockerfile`:

```dockerfile
FROM node:22-bookworm

RUN apt-get update && \
    apt-get install -y git zip && \
    corepack enable && \
    corepack prepare yarn@stable --activate && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /work
```

### 3. Build the Docker Image

```bash
docker build -t opmon-plugin-builder .
```

### 4. Build and Sign the Plugin

```bash
docker run --rm \
  -v $(pwd):/work \
  -e GRAFANA_ACCESS_POLICY_TOKEN \
  -e ROOT_URLS \
  opmon-plugin-builder \
  bash -e -c '
    corepack enable >/dev/null 2>&1
    corepack prepare yarn@stable --activate >/dev/null 2>&1

    rm -rf /work/opservicesti-opmon-datasource

    cd /tmp

    git clone -q https://github.com/opservices/opmon-datasource.git >/dev/null

    cd opmon-datasource

    yarn install --silent >/dev/null
    yarn build >/dev/null

    npx --yes @grafana/sign-plugin@latest \
      --rootUrls "$ROOT_URLS" \
      >/dev/null 2>&1

    cp -a dist /work/opservicesti-opmon-datasource

    echo "OK - OpMon Datasource plugin successfully built and signed."
  '
```

### 5. Install the Plugin in Grafana

Copy the generated plugin directory to Grafana's plugins directory:

```bash
cp -r opservicesti-opmon-datasource /var/lib/grafana/plugins/
```

Restart Grafana after copying the plugin.

## Datasource Configuration

When adding the datasource in Grafana:

1. Enter the URL of your OpMon installation.
2. Configure a valid OpMon username and password.
3. Save and test the connection.

Once configured, all available OpMon metrics can be used in Grafana dashboards and panels.

### Custom HTTP Headers

If you need to send custom HTTP headers, keep the datasource **Access** mode set to:

```text
Server
```

## Development

### Clone the Repository

```bash
git clone https://github.com/opservices/opmon-datasource.git
cd opmon-datasource
```

### Install Dependencies

```bash
yarn install --pure-lockfile
```

### Build the Plugin

```bash
yarn run build
```

### Run Development Mode

```bash
yarn dev
```
