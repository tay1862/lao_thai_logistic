# Rollback Quick Reference

Use this guide when a release must be rolled back immediately.

## Current Stable Checkpoint

- Branch: `release/stable-e2e-baseline`
- Tag: `tll-ops-hardening-20260331`

## Option 1: Check Out the Known Stable Tag

```bash
git fetch --tags origin
git checkout tll-ops-hardening-20260331
```

Use this when you need to inspect or redeploy the exact checkpoint.

## Option 2: Reset a Deployment Branch to the Stable Tag

```bash
git fetch --tags origin
git checkout release/stable-e2e-baseline
git reset --hard tll-ops-hardening-20260331
```

Use this only when the deployment branch itself must be moved back to the stable checkpoint.

## Option 3: Re-Deploy from the Stable Tag Without Moving Branch History

```bash
git fetch --tags origin
git checkout -b rollback/tll-ops-hardening-20260331 tll-ops-hardening-20260331
```

Use this when you want a dedicated rollback branch for redeploying or hotfixing.

## Database Rollback Safety

If the release included schema or data-risk changes, restore the pre-release backup:

```bash
npm run restore:db -- ./backups/<backup-file>.dump
```

## Post-Rollback Verification

Run these checks after redeploying the rollback target:

```bash
npm run build
npm run test:api
```

Then verify key flows manually:
- login
- create shipment
- scan update
- COD collect
- public tracking

## Important Note

Prefer rollback by redeploying a stable tag over rewriting shared history. If production already pulled a bad commit, redeployment from tag is usually the safest path.
