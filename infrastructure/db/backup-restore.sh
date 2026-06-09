#!/bin/bash

# Exit immediately if any command fails
set -e

# Configuration
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"jini_prod_db"}
DB_USER=${DB_USER:-"jini_admin"}
S3_BUCKET=${S3_BUCKET:-"s3://jini-solutions-backups/database"}
BACKUP_DIR="/tmp/pg_backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${DATE}.sql.gz"
RETENTION_DAYS=30

echo "🚀 Starting JNI production database backup process..."

# Ensure local backup directory exists
mkdir -p "$BACKUP_DIR"

# Step 1: Perform pg_dump and compress on the fly
echo "📦 Exporting database structure and data..."
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
echo "✅ Local backup file generated: ${BACKUP_FILE}"

# Step 2: Upload local backup file to AWS S3 bucket
echo "📤 Uploading backup file to AWS S3 storage bucket..."
if command -v aws &> /dev/null; then
    aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}/${DB_NAME}_backup_${DATE}.sql.gz"
    echo "✅ Backup successfully stored in S3."
else
    echo "⚠️ AWS CLI is not installed. Skipping upload to S3. Local backup retained."
fi

# Step 3: Enforce Retention Policy (Clean backups older than 30 days)
echo "🧹 Cleaning local backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "🧹 Cleaning S3 backups older than ${RETENTION_DAYS} days..."
if command -v aws &> /dev/null; then
    # S3 lifecycle policies are preferred, but this CLI fallback cleans old files manually
    aws s3 ls "$S3_BUCKET" | while read -r line; do
        createDate=$(echo "$line" | awk '{print $1" "$2}')
        createDateSeconds=$(date -d "$createDate" +%s)
        olderThanSeconds=$(date -d "${RETENTION_DAYS} days ago" +%s)
        if [ "$createDateSeconds" -lt "$olderThanSeconds" ]; then
            fileName=$(echo "$line" | awk '{print $4}')
            if [ -n "$fileName" ]; then
                aws s3 rm "${S3_BUCKET}/${fileName}"
            fi
        fi
    done
fi

echo "🎉 Database backup process finished successfully!"

# --- RESTORE COMMAND REFERENCE ---
# To restore a backup, run the following commands:
# 1. Download file: aws s3 cp s3://jini-solutions-backups/database/jini_prod_db_backup_TIMESTAMP.sql.gz /tmp/restore.sql.gz
# 2. Decompress: gunzip /tmp/restore.sql.gz
# 3. Restore schema & data: psql -h localhost -U jini_admin -d jini_prod_db -f /tmp/restore.sql
