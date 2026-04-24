#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-tll_db}"
DB_USER="${DB_USER:-tll_user}"
BACKUP_MODE="${BACKUP_MODE:-docker}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

if [[ "${BACKUP_MODE}" == "docker" ]]; then
  docker compose exec -T db pg_dump -U "${DB_USER}" -d "${DB_NAME}" -Fc > "${BACKUP_FILE}"
else
  : "${DATABASE_URL:?DATABASE_URL is required when BACKUP_MODE is not docker}"
  pg_dump "${DATABASE_URL}" -Fc > "${BACKUP_FILE}"
fi

CHECKSUM_FILE="${BACKUP_FILE}.sha256"
shasum -a 256 "${BACKUP_FILE}" > "${CHECKSUM_FILE}"

echo "Backup created: ${BACKUP_FILE}"
echo "Checksum saved: ${CHECKSUM_FILE}"
