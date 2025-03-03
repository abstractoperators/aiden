# Prometheus

Prometheus is a monitoring tool. This directory contains configuration files for a Prometheus backend on three different environments - dev (local), staging, prod.

`web.yml` contains web configuration for the Prometheus backend. Importantly, it contains `basic_auth_users`, which is a list of users and their passwords for basic authentication on the Prometheus backend. The passwords have been hashed using bcrypt, so it is okay to store them in plaintext. Developers should check 1password for the plaintext passwords.
When logging in, the username is `admin` and the password is the plaintext password for the environment.

`prometheus.yml` contains other configuration for the Prometheus backend. It is mostly the same across environments, but there are some differences in the `scrape_configs` section. `scrape_configs` configures which services Prometheus scrapes metrics from. The endpoints for these services differ depending on environment. It contains a templated environment variable `$PROMETHEUS_BASIC_AUTH` which is the credential used to authenticate with the exporters from which Prometheus scrapes metrics.
Note that environment variables don't actually work in prometheus config files - instead, `start.sh` will search and replace this variable with the actual credential before starting the Prometheus backend. Developers may place the plaintext value of this credential in `.env` in this directory and expect docker compose to load them at runtime.
