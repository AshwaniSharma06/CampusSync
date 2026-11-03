#!/bin/sh
set -e

# If a persistent volume is mounted at /data
if [ -d "/data" ]; then
    echo "[CampusSync Docker] Detected persistent volume at /data"
    
    # Seed database into persistent volume if none exists yet
    if [ ! -f "/data/campussync.db" ] && [ -f "/app/campussync.db" ]; then
        echo "[CampusSync Docker] Initializing persistent database at /data/campussync.db from release seed..."
        cp /app/campussync.db /data/campussync.db
    else
        echo "[CampusSync Docker] Preserving existing database at /data/campussync.db"
    fi

    # Seed ChromaDB into persistent volume if none exists yet
    if [ ! -d "/data/chromadb" ] && [ -d "/app/backend/data/chromadb" ]; then
        echo "[CampusSync Docker] Initializing persistent ChromaDB at /data/chromadb from release seed..."
        cp -r /app/backend/data/chromadb /data/chromadb
    else
        echo "[CampusSync Docker] Preserving existing ChromaDB at /data/chromadb"
    fi

    # Set default persistent environment variables if not already overridden
    if [ -z "$DATABASE_URL" ]; then
        export DATABASE_URL="sqlite:////data/campussync.db"
    fi
    if [ -z "$CHROMA_PERSIST_DIRECTORY" ]; then
        export CHROMA_PERSIST_DIRECTORY="/data/chromadb"
    fi
fi

echo "[CampusSync Docker] Starting Uvicorn server on port ${PORT:-8000}..."
exec python -m uvicorn backend.main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers --forwarded-allow-ips="*"

