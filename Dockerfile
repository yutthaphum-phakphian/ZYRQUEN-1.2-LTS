# ZYRQUEN Ω∞ Sovereign Mock API Gateway Server
# Production-ready, lightweight Python container

FROM python:3.14-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=3000 \
    SYSTEM_STATUS="LOCKED_FROZEN_v1.2_LTS"

# Create non-root user for security
RUN groupadd -r zyrquen && useradd -r -g zyrquen -d /app -s /sbin/nologin zyrquen

# Set working directory
WORKDIR /app

# Copy API server script
COPY mock_api_server.py /app/mock_api_server.py

# Set permissions
RUN chown -R zyrquen:zyrquen /app

# Switch to non-root user
USER zyrquen

# Expose API Gateway port
EXPOSE 3000

# Healthcheck targeting Level 1 Telemetry Endpoint
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:3000/api/v1/telemetry')" || exit 1

# Start Sovereign Mock API Server
CMD ["python3", "mock_api_server.py"]
