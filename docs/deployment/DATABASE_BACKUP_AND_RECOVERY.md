# RVITM Mitra AI — Database Backup & Disaster Recovery Guide

## 1. Automated PostgreSQL Backups

To create a consistent, compressed snapshot of the PostgreSQL database (including vector embeddings, chunks, and governance tables):

```bash
# Set timestamp and backup filename
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./backups/rvitm_mitra_${BACKUP_DATE}.sql.gz"
mkdir -p ./backups

# Execute pg_dump inside the database container
docker compose exec -T db pg_dump -U postgres -d rvitm_mitra | gzip > "${BACKUP_FILE}"
echo "Backup successfully created at ${BACKUP_FILE}"
```

---

## 2. Disaster Recovery & Database Restoration

To restore from a backup snapshot:

```bash
# 1. Stop backend service to prevent write conflicts
docker compose stop backend

# 2. Decompress and restore database
gunzip -c ./backups/rvitm_mitra_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T db psql -U postgres -d rvitm_mitra

# 3. Restart backend service
docker compose start backend

# 4. Verify system health
curl http://localhost:8000/api/v1/health
```

---

## 3. Recommended Automated Backup Cron

Add a daily automated backup at 02:00 AM:
```bash
0 2 * * * cd /opt/rvitm-mitra && docker compose exec -T db pg_dump -U postgres -d rvitm_mitra | gzip > "/var/backups/rvitm_mitra_$(date +\%F).sql.gz"
```
