# คู่มือติดตั้งและใช้งานระบบ (Thai-Lao Logistics)

เอกสารนี้สรุปขั้นตอนติดตั้ง, รันระบบ, ทดสอบ, deploy, monitoring, และ backup/restore แบบใช้งานจริง

## 1) สถานะความพร้อมล่าสุด

จากผลที่คุณรันล่าสุด:
- `npm run build` ผ่าน
- `npm run test:all` ผ่าน (API + E2E)
- branch `main` ดึงโค้ดล่าสุดแล้ว

สรุป: ระบบพร้อมใช้งานในระดับ production baseline ได้

## 2) สิ่งที่ต้องมีล่วงหน้า

- Node.js 20+
- npm 10+
- Docker + Docker Compose
- PostgreSQL client tools (ถ้าจะ backup/restore แบบ non-docker)
- Git

ตรวจสอบเวอร์ชัน:

```bash
node -v
npm -v
docker -v
docker compose version
```

## 3) ติดตั้งโปรเจ็กต์ครั้งแรก

```bash
git clone https://github.com/tay1862/lao_thai_logistic.git
cd lao_thai_logistic
npm ci
```

## 4) ตั้งค่า Environment

1. คัดลอกไฟล์ตัวอย่าง

```bash
cp .env.example .env
```

2. แก้ค่าใน `.env`
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- ค่าของ Sentry (ถ้าใช้งานจริง)

แนะนำสร้าง JWT secret:

```bash
openssl rand -base64 32
```

## 5) รันฐานข้อมูล (Local)

แนะนำใช้ Docker:

```bash
docker compose up -d db
```

ตรวจสอบสถานะ:

```bash
docker compose ps
```

## 6) เตรียมข้อมูลเริ่มต้น

```bash
npm run test:seed
```

บัญชีทดสอบหลัก:
- `admin@thai-lao.com` / `Admin@123456`
- `manager.th@thai-lao.com` / `Manager@123456`
- `staff.th@thai-lao.com` / `Staff@123456`
- `staff.la@thai-lao.com` / `Staff@123456`

## 7) รันระบบโหมดพัฒนา

```bash
npm run dev
```

เข้าใช้งานที่:
- `http://localhost:3000`

## 8) รันระบบแบบ Production (Local Verification)

```bash
npm run build
npm run start
```

หมายเหตุ:
- ถ้า `next start` แจ้งเตือนเรื่อง `output: standalone` ถือว่าเป็น warning ที่คาดได้
- สำหรับ production จริง แนะนำรันผ่าน Docker/Nginx ที่เซ็ตไว้ในโปรเจ็กต์

## 9) Deploy ด้วย Docker (แนะนำ)

รันทุก service:

```bash
docker compose up -d --build
```

ค่าเริ่มต้น:
- App ผ่าน nginx ที่พอร์ต 80/443
- DB ผ่าน service `db`

ไฟล์สำคัญ:
- `docker-compose.yml`
- `Dockerfile`
- `nginx/nginx.conf`

## 10) Monitoring และ Observability

### 10.1 Sentry
ตั้งค่าใน `.env`:

```bash
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
SENTRY_ENVIRONMENT=production
```

ถ้า DSN ว่าง ระบบจะไม่ส่ง event

### 10.2 Loki + Promtail + Grafana
รัน stack แยก:

```bash
docker compose -f observability/docker-compose.observability.yml up -d
```

เข้า Grafana:
- `http://localhost:3001`
- user: `admin`
- password: `admin`

ดู baseline การตั้ง alert:
- `docs/runbooks/observability-alert-baseline.md`

## 11) Backup / Restore ฐานข้อมูล

### Backup

```bash
npm run backup:db
```

ไฟล์จะถูกเก็บใน `./backups` พร้อม checksum

### Restore

```bash
npm run restore:db -- ./backups/<file>.dump
```

รายละเอียดเต็ม:
- `docs/runbooks/db-backup-restore.md`

## 12) การทดสอบก่อนปล่อยใช้งาน

```bash
npm run build
npm run test:all
```

ถ้าผ่านทั้งคู่ ถือว่า baseline พร้อมใช้งาน

## 13) CI/CD

มี GitHub Actions ที่รันอัตโนมัติบน PR:
- `.github/workflows/ci.yml`
- pipeline รัน `npm run test:all`

## 14) Runbook ที่ควรใช้คู่กัน

- Release checklist:
  - `docs/runbooks/production-release-checklist.md`
- Rollback quick reference:
  - `docs/runbooks/rollback-quick-reference.md`
- DB backup/restore:
  - `docs/runbooks/db-backup-restore.md`
- Alert baseline:
  - `docs/runbooks/observability-alert-baseline.md`

## 15) ปัญหาที่เจอบ่อย

1. `DATABASE_URL` ผิด
- อาการ: API ขึ้น error ต่อ DB ไม่ได้
- แก้: ตรวจ host/user/password/db name และ container DB

2. Port ชนกัน
- อาการ: รันไม่ขึ้นเพราะพอร์ตถูกใช้
- แก้: เปลี่ยนพอร์ตหรือปิด service เดิม

3. E2E fail เพราะข้อมูลไม่ตรง
- แก้: รัน `npm run test:seed` ใหม่ก่อนเทส

4. ไม่เห็น log ใน Grafana
- แก้: ตรวจว่า `observability` stack รันครบ และ datasource เป็น Loki

## 16) คำแนะนำสำหรับใช้งานจริง

- ใช้ `.env` แยกตาม environment (dev/staging/prod)
- เก็บ secret ในระบบจัดการ secret (ไม่ commit ลง git)
- ตั้ง retention policy ของ backup
- ทำ restore drill อย่างน้อยเดือนละครั้ง
- กำหนด on-call และช่องทางแจ้งเตือนให้ชัดเจน
