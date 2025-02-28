#!/bin/sh

# CMD entrypoint adapted to use different config files based on ENV variable
# CMD entrypoint found here https://github.com/prometheus/prometheus/blob/main/Dockerfile

ENV=${ENV:-dev}

case "$ENV" in
  prod)
    CONFIG_FILE="/etc/prometheus/prometheus.prod.yml"
    ;;
  staging)
    CONFIG_FILE="/etc/prometheus/prometheus.staging.yml"
    ;;
  *)
    CONFIG_FILE="/etc/prometheus/prometheus.dev.yml"
    ;;
esac

echo "Starting Prometheus with config file: $CONFIG_FILE"

exec /bin/prometheus \
  --config.file="$CONFIG_FILE" \
  --storage.tsdb.path=/prometheus \
  --web.listen-address="0.0.0.0:9090" \
  "$@"