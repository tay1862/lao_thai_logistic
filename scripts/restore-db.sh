#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.dump>"
  exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-tll_db}"
DB_USER="${DB_USER:-tll_user}"
BACKUP_MODE="${BACKUP_MODE:-docker}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

if [[ -f "${BACKUP_FILE}.sha256" ]]; then
  shasum -a 256 -c "${BACKUP_FILE}.sha256"
fi

if [[ "${BACKUP_MODE}" == "docker" ]]; then
  docker compose exec -T db psql -U "${DB_USER}" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();"
  docker compose exec -T db dropdb -U "${DB_USER}" --if-exists "${DB_NAME}"
  docker compose exec -T db createdb -U "${DB_USER}" "${DB_NAME}"
  docker compose exec -T db pg_restore -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists < "${BACKUP_FILE}"
else
  : "${DATABASE_URL:?DATABASE_URL is required when BACKUP_MODE is not docker}"
  dropdb --if-exists "${DATABASE_URL}"
  createdb "${DATABASE_URL}"
  pg_restore -d "${DATABASE_URL}" --clean --if-exists "${BACKUP_FILE}"
fi

echo "Restore completed from: ${BACKUP_FILE}"
