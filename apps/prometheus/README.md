# Prometheus

Prometheus is a monitoring tool. This directory contains configuration files for a Prometheus backend on three different environments - dev (local), staging, prod.

`web.yml` contains web configuration for the Prometheus backend. Importantly, it contains `basic_auth_users`, which is a list of users and their passwords for basic authentication on the Prometheus backend. The passwords have been hashed using bcrypt, so it is okay to store them in plaintext. Developers should check 1password for the plaintext passwords.
When logging in, the username is `admin` and the password is the plaintext password for the environment.

`prometheus.yml` contains other configuration for the Prometheus backend. It is mostly the same across environments, but there are some differences in the `scrape_configs` section. `scrape_configs` configures which services Prometheus scrapes metrics from. The endpoints for these services differ depending on environment. It contains a templated environment variable `$PROMETHEUS_BASIC_AUTH` which is the credential used to authenticate with the exporters from which Prometheus scrapes metrics.
Note that environment variables don't actually work in prometheus config files - instead, `start.sh` will search and replace this variable with the actual credential before starting the Prometheus backend. Developers may place the plaintext value of this credential in `.env` in this directory and expect docker compose to load them at runtime.

## Potentially Useful Queries

[PromQL Documentation](https://prometheus.io/docs/prometheus/latest/querying/basics/)

```promql
# List all metrics by job
{job="job_name"}

# Average memory usage of all jobs
process_resident_memory_bytes / 1024 / 1024

# 95th percentile highs of http response time
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (handler, le))

# Average CPU usage of all jobs
rate(process_cpu_seconds_total[5m])

# Response duration grouped by handler (endpoint)
avg by (handler) (rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))

# Number of requests per endpoint
sum by (handler) (rate(http_request_duration_seconds_count[5m]))
```
