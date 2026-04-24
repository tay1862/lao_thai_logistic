# Production Release Checklist

This checklist is for release approval before deploying Thai-Lao Logistics to production.

## 1) Pre-Release Readiness

- [ ] Pull latest main and confirm no unresolved merge conflicts.
- [ ] Confirm CI passed on the release commit.
- [ ] Confirm database migration plan is reviewed.
- [ ] Confirm rollback owner and communication channel are assigned.

## 2) Environment and Secrets

- [ ] Production `.env` has required keys:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `NEXT_PUBLIC_APP_URL`
  - `SENTRY_DSN`
  - `NEXT_PUBLIC_SENTRY_DSN` (optional but recommended)
  - `SENTRY_ENVIRONMENT=production`
- [ ] `JWT_SECRET` rotated and not reused from staging.
- [ ] No secret files are tracked by git (`.env`, TLS keys, private certs).

## 3) Database Safety

- [ ] Run backup before deployment:

```bash
npm run backup:db
```

- [ ] Store backup artifact in off-host storage.
- [ ] Validate latest restore drill is not older than 30 days.

## 4) Build and Test Gate

- [ ] Build locally (or release environment):

```bash
npm run build
```

- [ ] Run full regression suite:

```bash
npm run test:all
```

## 5) Observability Gate

- [ ] Sentry events visible in the target environment.
- [ ] Grafana can query Loki logs.
- [ ] Alert routing channel verified (Slack/Email/PagerDuty).
- [ ] On-call person confirmed for release window.

### 5.1 Start Observability Stack

- [ ] Start app stack:

```bash
docker compose up -d --build
```

- [ ] Start observability stack:

```bash
docker compose -f observability/docker-compose.observability.yml up -d
```

- [ ] Verify containers are healthy:

```bash
docker ps | grep -E "tll_web|tll_nginx|tll_loki|tll_promtail|tll_grafana"
```

- [ ] Verify Loki and Grafana health:

```bash
curl -s http://localhost:3100/ready
curl -s http://localhost:3001/api/health
```

### 5.2 Sentry Alert Setup (Production)

- [ ] Confirm Sentry env vars are present in production runtime:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_DSN`
  - `SENTRY_ENVIRONMENT=production`
- [ ] Create these Sentry alerts:
  - Error Volume Spike (Critical)
  - New Unhandled Exception (High)
  - Performance Degradation (High)
  - See thresholds in `docs/runbooks/observability-alert-baseline.md`.

### 5.3 Grafana/Loki Alert Setup (Production)

- [ ] Change default Grafana admin credentials.
- [ ] Configure Contact Points (Email/Slack/PagerDuty).
- [ ] Configure Notification Policies for critical vs non-critical.
- [ ] Create baseline Loki alert rules from `docs/runbooks/observability-alert-baseline.md`.

### 5.4 One-Shot Alert Test (Required)

- [ ] Trigger one Sentry test event from browser console on production app:

```js
window.setTimeout(() => { throw new Error("TLL_SENTRY_TEST_ONCE") }, 0)
```

- [ ] Confirm Sentry issue is created and notification is delivered.

- [ ] Create temporary Grafana test alert rule:
  - Query: `sum(count_over_time({compose_service="nginx"}[1m]))`
  - Condition: above `0` for `1m`

- [ ] Generate test traffic:

```bash
for i in {1..20}; do curl -s -o /dev/null http://localhost/track; done
```

- [ ] Confirm Grafana alert fires and notification is delivered.
- [ ] Remove/disable temporary test rule after successful validation.

## 6) Deployment

- [ ] Deploy with approved release tag.
- [ ] Verify application health endpoint and main flows:
  - login
  - create shipment
  - scan status update
  - COD collect
  - track page

## 7) Post-Deployment Verification (first 30 minutes)

- [ ] No spike in 5xx errors.
- [ ] P95 latency within normal band.
- [ ] No sustained increase in auth/login failures.
- [ ] No queue/backlog growth in operational dashboards.
- [ ] No unresolved alert test artifacts remain (temporary rules disabled, test incidents resolved).

## 8) Rollback Criteria

Rollback immediately if any condition persists beyond 10 minutes:

- Error rate > 3% on key API routes.
- P95 latency > 2x baseline.
- Critical business flow failure (create shipment, scan, COD collect).

## 9) Rollback Steps (Quick)

1. Stop rollout traffic to current version.
2. Redeploy previous stable tag.
3. If needed, restore DB from pre-release backup using:

```bash
npm run restore:db -- ./backups/<backup-file>.dump
```

4. Announce incident and open postmortem.
