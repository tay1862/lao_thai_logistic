# Observability Alert Baseline

This document defines a practical baseline for Sentry and Grafana/Loki alerting in production.

## Sentry Baseline Alerts

Create these alerts in Sentry project settings:

### 1) Error Volume Spike (Critical)

- Condition: event count for `level:error` increases by >= 200% vs last 1 hour baseline.
- Window: 5 minutes.
- Action: notify on-call channel immediately.

### 2) New Unhandled Exception (High)

- Condition: first seen issue, `unhandled:true`, environment `production`.
- Window: real-time.
- Action: notify backend/frontend owner and create incident ticket.

### 3) Performance Degradation (High)

- Condition: transaction p95 for key routes exceeds threshold for 3 consecutive windows.
- Suggested thresholds:
  - `/dashboard/shipments`: p95 > 1500ms
  - `/api/v1/shipments`: p95 > 1000ms
  - `/api/v1/dashboard/stats`: p95 > 1200ms

## Grafana/Loki Baseline Alerts

Use Loki queries against container labels (`compose_service`) from Promtail config.

### 1) API 5xx Rate (Critical)

- Query pattern: count logs containing `status=5` or `HTTP 5` in `tll_web`.
- Threshold: > 20 events / 5 minutes.
- Action: page on-call.

### 2) Authentication Failure Burst (High)

- Query pattern: `invalid credentials` or repeated login failures.
- Threshold: > 30 events / 10 minutes.
- Action: notify security/ops channel.

### 3) Database Connectivity Errors (Critical)

- Query pattern: `ECONNREFUSED`, `timeout`, `Prisma`, `db` connection errors.
- Threshold: > 5 events / 5 minutes.
- Action: page on-call and start DB incident runbook.

## Dashboard Baseline Panels

Create a dashboard with these panels:

- Request volume by minute.
- 4xx and 5xx split by API route.
- P50/P95 response time for key API routes.
- Login success/failure trend.
- Shipment create success/failure trend.
- COD collect success/failure trend.

## Operational Notes

- Tune thresholds after 1 to 2 weeks of production traffic.
- Avoid alert noise: route informational alerts to non-paging channel.
- Every critical alert should map to one clear owner and one runbook.
