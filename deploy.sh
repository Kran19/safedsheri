#!/bin/bash

# 1. Ensure the backups directory exists
mkdir -p db_backups

# 2. Define the backup filename with current timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="db_backups/backup_${TIMESTAMP}.sql"

echo "================================================="
echo "📦 1. Starting database backup..."
echo "================================================="

# Check if the postgres container is actually running before trying to back it up
if docker ps | grep -q "safedsheri-postgres"; then
    # Run pg_dump inside the container and pipe the output to our local file
    docker exec safedsheri-postgres pg_dump -U postgres -d safedsheri > "$BACKUP_FILE"
    
    # Check if the file was created and is not empty
    if [ -s "$BACKUP_FILE" ]; then
        echo "✅ Backup saved successfully to: $BACKUP_FILE"
    else
        echo "⚠️  Backup file is empty. Something went wrong!"
        rm -f "$BACKUP_FILE"
    fi
else
    echo "⚠️  Postgres container (safedsheri-postgres) is not running!"
    echo "Skipping backup this time."
fi

echo ""
echo "================================================="
echo "🧹 2. Cleaning up old backups (keeping last 10)..."
echo "================================================="

# List all backups sorted by time (newest first), skip the first 10, and delete the rest
ls -t db_backups/backup_*.sql 2>/dev/null | tail -n +11 | xargs -I {} rm -- {}
echo "✅ Old backups cleaned up!"

echo ""
echo "================================================="
echo "📥 3. Pulling latest code from GitHub..."
echo "================================================="
git pull origin main

echo ""
echo "================================================="
echo "🚀 4. Rebuilding & Starting Docker Containers..."
echo "================================================="
docker compose up --build -d

echo ""
echo "🎉 Deployment and backup completed successfully!"
