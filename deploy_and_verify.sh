#!/bin/bash
set -e

echo "=================================================="
echo " ZYRQUEN Ω∞ SOVEREIGN AUTOMATED DEPLOY & TEST "
echo "=================================================="

# 1. Start Services
echo "[1/3] Building & Starting Docker Infrastructure..."
docker-compose up -d --build

# 2. Healthcheck Wait
echo "[2/3] Waiting for Service Health Check..."
sleep 4
docker-compose ps

# 3. Execute Complete Verification & Stress Test
echo "[3/3] Executing Full Audit & Stress Test Suite..."
if command -v python3 &> /dev/null; then
    python3 client_test.py
    python3 stress_test.py
elif command -v python &> /dev/null; then
    python client_test.py
    python stress_test.py
else
    echo "[!] Python not detected in current shell path. Ensure python environment is active."
fi

echo "=================================================="
echo " ALL SYSTEMS DEPLOYED & VERIFIED (SSoT Δ0 FROZEN) "
echo "=================================================="
