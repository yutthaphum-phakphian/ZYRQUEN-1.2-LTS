FROM python:3.11-slim

WORKDIR /app

# Install base dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir \
    fastapi==0.110.0 \
    uvicorn[standard]==0.28.0 \
    pydantic==2.6.4 \
    httpx==0.27.0 \
    websockets==12.0 \
    redis==5.0.3

COPY . /app

EXPOSE 8000

CMD ["uvicorn", "app_unified:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
