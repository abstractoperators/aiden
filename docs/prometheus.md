# 🚨 Prometheus Documentation

## 📌 Overview

This provides real-time observability for agents, runtimes, and token operations using:

- Prometheus for scraping, storing, and querying time-series metrics  
- Alertmanager for sending critical alerts (via Slack)  
- FastAPI app with Prometheus instrumentation  
- Infrastructure with support for dev, staging, and prod environments  
- AWS ECS Fargate for runtime provisioning  
- Slack integration for notifications

## 📦 Stack Summary

| Component     | Description |
|--------------|-------------|
| FastAPI      | Exposes metrics (`/metrics_prometheus`) via `prometheus_fastapi_instrumentator` |
| Prometheus   | Scrapes application and runtime metrics every 15s |
| Alertmanager | Sends alerts to Slack when triggered by Prometheus rules |
| Docker       | Single container runs both Prometheus and Alertmanager |
| ECS Fargate  | Runtimes dynamically provisioned for agents via Celery tasks |
| Slack Alerts | Notifications for agent lifecycle events |

## 🌐 Endpoints & Metrics

### FastAPI Metrics Exposure

- `/metrics_prometheus`: Public metrics endpoint used by Prometheus.  
- `/metrics`: (Currently disabled) Secure metrics endpoint, protected by HTTP Basic Auth.

### Key Metrics

| Metric Name             | Type    | Labels   | Description |
|-------------------------|---------|----------|-------------|
| agent_liveness_status   | Gauge   | agent_id | 1 = alive, 0 = dead |
| agent_restart_timestamp | Gauge   | agent_id | Unix timestamp of most recent restart |
| agent_live_count        | Gauge   | None     | Total currently live agents |
| agent_killed_total      | Counter | None     | Cumulative number of agents that have been killed |
| agent_event_total       | Counter | type     | Tracks start, kill, restart event counts |

Heartbeat signals are sent via `POST /agents/{agent_id}/heartbeat`, which updates in-memory stores and associated metrics.

## 🔄 Agent Liveness Monitoring

- A coroutine `monitor_agent_liveness()` runs in the FastAPI lifespan context.  
- Every 15s, it:
  - Iterates through `agent_heartbeat_store`
  - Flags agents as down if no heartbeat in last 75s
  - Detects restarts if agent reappears after short downtime
  - Emits Prometheus metrics (restart, dead, etc.)

This approach ensures Prometheus and Alertmanager are aware of real-time agent health and can generate alerts accordingly.

## ⚙️ Prometheus Configuration

### `prometheus.yml`

```yaml
global:
  scrape_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["localhost:9093"]

rule_files:
  - /etc/prometheus/alerts.rules.yml

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
    basic_auth:
      username: "admin"
      password: "$PROMETHEUS_BASIC_AUTH"

  - job_name: "api"
    metrics_path: /metrics_prometheus
    scrape_interval: 5s
    static_configs:
      - targets: ["host.docker.internal:8003"]
    basic_auth:
      username: "prometheus"
      password: "$PROMETHEUS_BASIC_AUTH"
```

_Note: frontend and agent-runtime scrape jobs are yet to be added._

## 🛠️ Alertmanager Configuration

### `alertmanager.yml`

```yaml
global:
  resolve_timeout: 1m

route:
  receiver: 'slack-notifications'
  group_wait: 0s
  group_interval: 10s
  repeat_interval: 1m

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - send_resolved: true
        username: 'Prometheus'
        channel: '#alerts'
        api_url: $SLACK_WEBHOOK_URL
        title: '{{ .CommonAnnotations.summary }}'
        text: >
          {{ range .Alerts }}
            *Alert:* {{ .Labels.alertname }}
            *Status:* {{ .Status }}
            *Instance:* {{ .Labels.instance }}
            *Summary:* {{ .Annotations.summary }}
            *Time:* {{ .StartsAt }}
          {{ end }}
```

## 📣 Alert Rules

### `alerts.rules.yml`

```yaml
groups:
  - name: agent-lifecycle-alerts
    rules:
      - alert: AgentStarted
        expr: increase(agent_event_total{type="start"}[1m]) > 0
        for: 0m
        labels:
          severity: info
        annotations:
          summary: "Agent started"

      - alert: AgentRestarted
        expr: time() - agent_restart_timestamp < 60
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "Agent restarted"

      - alert: AgentKilled
        expr: increase(agent_event_total{type="kill"}[1m]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Agent killed"

      - alert: AgentDown
        expr: agent_liveness_status == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Agent {{ $labels.agent_id }} is not responding"
```

## 🐳 Docker Setup

### Dockerfile (Combined Prometheus + Alertmanager)

```Dockerfile
FROM debian:bullseye

RUN apt-get update && apt-get install -y curl tar

ENV PROM_VERSION=2.52.0
ENV ALERTMANAGER_VERSION=0.27.0

RUN curl -LO https://github.com/prometheus/prometheus/releases/download/v${PROM_VERSION}/prometheus-${PROM_VERSION}.linux-amd64.tar.gz && \\
    tar -xzf prometheus-${PROM_VERSION}.linux-amd64.tar.gz && \\
    mv prometheus-${PROM_VERSION}.linux-amd64/prometheus /bin/prometheus

RUN curl -LO https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz && \\
    tar -xzf alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz && \\
    mv alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/alertmanager /bin/alertmanager

COPY *.yml /etc/prometheus/
COPY start.sh .
EXPOSE 9090 9093
ENTRYPOINT ["./start.sh"]
```

## 🏗️ AWS Runtime Provisioning (ECS)

### Flow

1. User requests agent start.  
2. Backend calls:

```python
tasks.start_agent.delay(agent_id, runtime_id)
```

3. If no idle runtimes exist:
   - Automatically provisions new ones using:

```python
tasks.create_runtime.delay(...)
```

   - Configured through env var `RUNTIME_POOL_INCREMENT`

4. Runtime provisioned on AWS ECS Fargate, with:
   - Individual runtime numbers
   - Subdomains like `agent-4.staigen.space`
   - Mounted to target group via shared ALB

## 🌍 Environments Overview

| ENV     | Config Files Used                      | CORS Origins                          |
|---------|----------------------------------------|----------------------------------------|
| dev     | prometheus.dev.yml, web.dev.yml        | localhost:3000, localhost:8001        |
| staging | prometheus.staging.yml, web.staging.yml| https://staigen.space                 |
| prod    | prometheus.yml, web.yml                | https://aidn.fun                      |

_Passed to the container using `ENV` environment variable._

## 🔐 Security Notes

- Basic auth for Prometheus metrics is currently disabled.  
- When re-enabled:
  - Use `/metrics_prometheus`
  - Requires:

```
Authorization: Basic base64(prometheus:PROMETHEUS_BASIC_AUTH)
```

- `PROMETHEUS_BASIC_AUTH` and `SLACK_WEBHOOK_URL` are environment secrets.

## ✅ Status Summary

| Feature                   | Status | Notes                           |
|---------------------------|--------|----------------------------------|
| Metrics instrumentation   | ✅     | FastAPI + custom metrics         |
| Slack alerts              | ✅     | Alertmanager working             |
| Runtime provisioning fallback | ✅  | Auto-provisions if none idle     |
| Frontend/runtime scrape config | 🚧 | To be added                      |
| ENV-based config switching| ✅     | Via `ENV` and `start.sh`         |
| ECS Fargate integration   | ✅     | Runtime creation works           |
