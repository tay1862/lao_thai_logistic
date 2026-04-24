#!/usr/bin/env bash
# =============================================================================
# setup-vps.sh — One-time VPS setup for Thai-Lao Logistic
#
# Tested on: Ubuntu 22.04 / 24.04 LTS
# Run as: sudo bash scripts/setup-vps.sh
#
# What this script does:
#   1. Install Docker + Docker Compose plugin
#   2. Create /opt/tll directory + .env file
#   3. Install certbot + obtain Let's Encrypt SSL certificate
#   4. Pull & start all containers
#   5. Run Prisma migrations + seed initial data
# =============================================================================
set -euo pipefail

# ── Config (edit before running) ─────────────────────────────────────────────
DOMAIN="${DOMAIN:-YOUR_DOMAIN.COM}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@YOUR_DOMAIN.COM}"
DEPLOY_DIR="/opt/tll"
REPO_URL="${REPO_URL:-https://github.com/YOUR_ORG/lao_thai_logistic-main.git}"
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
die()  { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

[[ "$EUID" -eq 0 ]] || die "Run as root: sudo bash scripts/setup-vps.sh"
[[ "$DOMAIN" == "YOUR_DOMAIN.COM" ]] && die "Set DOMAIN before running: DOMAIN=example.com sudo bash scripts/setup-vps.sh"

# ── 1. System updates + dependencies ─────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq
apt-get install -y -qq curl git ca-certificates gnupg lsb-release ufw certbot

# ── 2. Install Docker ─────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  log "Installing Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  log "Docker installed: $(docker --version)"
else
  log "Docker already installed: $(docker --version)"
fi

# ── 3. Firewall ───────────────────────────────────────────────────────────────
log "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 4. Deploy directory ───────────────────────────────────────────────────────
log "Setting up $DEPLOY_DIR..."
mkdir -p "$DEPLOY_DIR"
mkdir -p /var/www/certbot

# Clone repo if not already present
if [[ ! -f "$DEPLOY_DIR/docker-compose.prod.yml" ]]; then
  log "Cloning repository..."
  git clone "$REPO_URL" "$DEPLOY_DIR"
fi

# ── 5. Create .env if not present ────────────────────────────────────────────
if [[ ! -f "$DEPLOY_DIR/.env" ]]; then
  log "Creating .env from template..."
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"

  # Generate strong secrets automatically
  DB_PASS=$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-32)
  JWT_SEC=$(openssl rand -base64 48)

  sed -i "s|CHANGE_THIS_STRONG_DB_PASSWORD|${DB_PASS}|g" "$DEPLOY_DIR/.env"
  sed -i "s|CHANGE_THIS_TO_A_RANDOM_256_BIT_SECRET|${JWT_SEC}|g" "$DEPLOY_DIR/.env"
  sed -i "s|http://localhost:3000|https://${DOMAIN}|g" "$DEPLOY_DIR/.env"
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://tll_user:${DB_PASS}@db:5432/tll_db|" "$DEPLOY_DIR/.env"
  sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" "$DEPLOY_DIR/.env"
  # WEB_IMAGE will be set by the CI/CD pipeline on first deploy
  echo "" >> "$DEPLOY_DIR/.env"
  echo "# Set by CI/CD — do not edit manually" >> "$DEPLOY_DIR/.env"
  echo "WEB_IMAGE=ghcr.io/YOUR_ORG/lao_thai_logistic-main:latest" >> "$DEPLOY_DIR/.env"

  warn ".env created. Review and update $DEPLOY_DIR/.env before continuing."
  warn "Especially: SENTRY_DSN, NEXT_PUBLIC_APP_URL"
  warn ""
  warn "Press Enter to continue, or Ctrl+C to abort and edit .env first."
  read -r
fi

# ── 6. SSL certificate (Let's Encrypt) ───────────────────────────────────────
log "Obtaining SSL certificate for $DOMAIN..."
if [[ ! -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
  # Use standalone mode (certbot binds to port 80 directly — no nginx needed yet)
  certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$ADMIN_EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" || {
      warn "www.$DOMAIN failed — retrying with only $DOMAIN"
      certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$ADMIN_EMAIL" \
        -d "$DOMAIN"
    }
  log "SSL certificate obtained."
else
  log "SSL certificate already exists — skipping."
fi

# Replace nginx.conf placeholder with actual domain
log "Configuring nginx for $DOMAIN..."
sed -i "s|YOUR_DOMAIN.COM|${DOMAIN}|g" "$DEPLOY_DIR/nginx/nginx.conf"

# ── 7. Auto-renew cron (certbot renew) ───────────────────────────────────────
if ! crontab -l 2>/dev/null | grep -q 'certbot renew'; then
  log "Adding certbot auto-renew cron..."
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker restart tll_nginx") \
    | crontab -
fi

# ── 8. Start containers ───────────────────────────────────────────────────────
log "Starting containers..."
cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml pull db nginx
docker compose -f docker-compose.prod.yml up -d db nginx
log "Waiting for database to be ready..."
sleep 8

# ── 9. Note: web container will start on first CI/CD deploy ──────────────────
warn ""
warn "═══════════════════════════════════════════════════════"
warn "VPS setup complete!"
warn ""
warn "Next steps:"
warn "  1. Add these GitHub repository Secrets:"
warn "       VPS_HOST     = $(curl -s ifconfig.me)"
warn "       VPS_USER     = $USER"
warn "       VPS_SSH_KEY  = (your private SSH key)"
warn ""
warn "  2. Review $DEPLOY_DIR/.env"
warn "     Set NEXT_PUBLIC_APP_URL=https://${DOMAIN}"
warn "     Update WEB_IMAGE to your GHCR image path"
warn ""
warn "  3. Push to main → GitHub Actions builds image → deploys automatically"
warn ""
warn "  4. For first deploy, run:"
warn "       cd $DEPLOY_DIR"
warn "       docker compose -f docker-compose.prod.yml up -d"
warn "       docker compose -f docker-compose.prod.yml exec web npx prisma migrate deploy"
warn "       docker compose -f docker-compose.prod.yml exec web npx prisma db seed"
warn "═══════════════════════════════════════════════════════"
