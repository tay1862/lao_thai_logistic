# Database Backup and Restore Runbook

## Scope
This runbook covers operational backup and restore for PostgreSQL used by Thai-Lao Logistics.

## Prerequisites
- Docker Compose environment is running (`db` service healthy)
- Access to project root
- Sufficient disk space for dumps

## Backup
1. Run backup script:
   ```bash
   bash scripts/backup-db.sh
   ```
2. Output files are created in `./backups` by default:
   - `<db_name>_<timestamp>.dump`
   - `<db_name>_<timestamp>.dump.sha256`
3. Copy backup files to off-host storage (S3/object storage/NAS).

## Restore
1. Identify target dump file, for example:
   ```bash
   bash scripts/restore-db.sh ./backups/tll_db_20260331_010203.dump
   ```
2. Script validates checksum when `<dump>.sha256` is present.
3. Script terminates active DB sessions, recreates database, then restores dump.

## Verification
1. Confirm tables are present:
   ```bash
   docker compose exec -T db psql -U tll_user -d tll_db -c "\dt"
   ```
2. Run Prisma health check:
   ```bash
   npm run test:api
   ```

## Environment Variables
- `BACKUP_MODE`:
  - `docker` (default): executes through `docker compose exec`
  - any other value: uses local `pg_dump/pg_restore` with `DATABASE_URL`
- `BACKUP_DIR` (default `./backups`)
- `DB_NAME` (default `tll_db`)
- `DB_USER` (default `tll_user`)
- `DATABASE_URL` (required in non-docker mode)

## Operational Policy (Recommended)
- Backup frequency: at least daily + before each production deployment
- Retention: 7 daily, 4 weekly, 6 monthly snapshots
- Restore drill: run monthly and document RTO/RPO outcomes
