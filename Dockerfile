# Production Dockerfile for CampusSync Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies & curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first for caching
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Create volume mount point for persistent storage
RUN mkdir -p /data && chmod 777 /data

# Copy backend application and seed database
COPY backend/ ./backend/
COPY campussync.db ./campussync.db
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Set environment
ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

# Health check verifies the FastAPI server is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
