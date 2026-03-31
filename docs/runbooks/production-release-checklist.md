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
