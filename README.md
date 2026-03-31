# Thai-Lao Logistics

Production-oriented logistics web application built with Next.js App Router, Prisma, and PostgreSQL.

## Core Commands

```bash
npm run dev
npm run build
npm run start
```

## Test Commands

```bash
npm run test:seed
npm run test:api
npm run test:e2e
npm run test:all
```

## Monitoring and Alerting

### Sentry

Sentry is wired for server, edge, and browser runtime.

Set these variables in your environment:

```bash
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
SENTRY_ENVIRONMENT=development
```

When DSN values are empty, Sentry initialization is automatically disabled.

### Log Aggregation (Loki + Promtail + Grafana)

Observability stack files are in `observability/`.

Start stack:

```bash
docker compose -f observability/docker-compose.observability.yml up -d
```

Access Grafana at `http://localhost:3001`.
Default credentials:

- user: `admin`
- password: `admin`

Alert baseline runbook: `docs/runbooks/observability-alert-baseline.md`

## Database Backup and Restore

Run backup:

```bash
npm run backup:db
```

Restore from dump:

```bash
npm run restore:db -- ./backups/<file>.dump
```

Detailed runbook: `docs/runbooks/db-backup-restore.md`

## Release Process

Production release checklist: `docs/runbooks/production-release-checklist.md`

## CI

GitHub Actions workflow is configured in `.github/workflows/ci.yml` to run `npm run test:all` on every pull request.
