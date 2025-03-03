#!/bin/sh

# CMD entrypoint adapted to use different config files based on ENV variable
# CMD entrypoint found here https://github.com/prometheus/prometheus/blob/main/Dockerfile

ENV=${ENV:-dev}
echo "ENV: $ENV"

case "$ENV" in
  prod)
    CONFIG_FILE="/etc/prometheus/prometheus.yml"
    WEB_CONFIG_FILE="/etc/prometheus/web.yml"
    ;;
  staging)
    CONFIG_FILE="/etc/prometheus/prometheus.staging.yml"
    WEB_CONFIG_FILE="/etc/prometheus/web.staging.yml"
    ;;
  *)
    CONFIG_FILE="/etc/prometheus/prometheus.dev.yml"
    WEB_CONFIG_FILE="/etc/prometheus/web.dev.yml"
    ;;
esac

echo "Starting Prometheus with config file: $CONFIG_FILE"
echo "Starting Prometheus with web config file: $WEB_CONFIG_FILE"

exec /bin/prometheus \
  --config.file="$CONFIG_FILE" \
  --storage.tsdb.path=/prometheus \
  --web.listen-address="0.0.0.0:9090" \
  --web.config.file="$WEB_CONFIG_FILE" \
  "$@"