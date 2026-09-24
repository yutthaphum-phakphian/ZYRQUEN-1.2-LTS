#!/usr/bin/env bash
# ==============================================================================
# ZYRQUEN Ω∞ Sovereign Coder Workspace - SSH Tunnel & Port Forwarding Daemon
# Engine Version: LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 Baseline Drift 0.00%
# Sovereign Principal Architect: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
# ==============================================================================

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
NC="\033[0m"

WORKSPACE_NAME="${1:-zyrquen-sovereign}"
CODER_HOST="${CODER_HOST:-coder.${WORKSPACE_NAME}}"

LOCAL_API_PORT=8443
LOCAL_OTEL_PORT=4318
LOCAL_UI_PORT=3000

REMOTE_API_PORT=8443
REMOTE_OTEL_PORT=4318
REMOTE_UI_PORT=3000

echo -e "${BOLD}${CYAN}==============================================================================${NC}"
echo -e "${BOLD}${CYAN}  🌌 ZYRQUEN Ω∞ SOVEREIGN CODER WORKSPACE - SSH TUNNEL MANAGER             ${NC}"
echo -e "${BOLD}${CYAN}  SSoT Δ0 Zero Drift (0.00%) | Genesis Block Height #849202                  ${NC}"
echo -e "${BOLD}${CYAN}==============================================================================${NC}"
echo -e "Target Workspace: ${BOLD}${YELLOW}${WORKSPACE_NAME}${NC} (${CODER_HOST})"
echo -e "Forwarded Ports:"
echo -e "  • ${GREEN}http://localhost:${LOCAL_API_PORT}${NC}  ➔ Audit Trail API & Telemetry (Remote:${REMOTE_API_PORT})"
echo -e "  • ${GREEN}http://localhost:${LOCAL_OTEL_PORT}${NC}  ➔ OpenTelemetry OTLP Receiver (Remote:${REMOTE_OTEL_PORT})"
echo -e "  • ${GREEN}http://localhost:${LOCAL_UI_PORT}${NC}   ➔ Sovereign Console Dashboard UI (Remote:${REMOTE_UI_PORT})"
echo -e "------------------------------------------------------------------------------"

# Function to check if a port is in use locally
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z 127.0.0.1 $port >/dev/null 2>&1; then
    return 0 # Port in use
  else
    return 1 # Port free
  fi
}

# Start SSH Tunnel with auto-reconnect
start_tunnel() {
  echo -e "\n${YELLOW}[+] Establishing SSH Tunnel & Local Port Forwarding...${NC}"
  
  SSH_CMD="ssh -N \
    -L ${LOCAL_API_PORT}:127.0.0.1:${REMOTE_API_PORT} \
    -L ${LOCAL_OTEL_PORT}:127.0.0.1:${REMOTE_OTEL_PORT} \
    -L ${LOCAL_UI_PORT}:127.0.0.1:${REMOTE_UI_PORT} \
    -o ServerAliveInterval=15 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    ${CODER_HOST}"

  echo -e "Executing: ${BOLD}${SSH_CMD}${NC}\n"

  while true; do
    echo -e "${GREEN}[✓] Connecting SSH Tunnel to ${CODER_HOST}...${NC}"
    $SSH_CMD
    EXIT_CODE=$?
    echo -e "${RED}[!] SSH Tunnel disconnected (Exit code: ${EXIT_CODE}). Reconnecting in 5 seconds...${NC}"
    sleep 5
  done
}

# Quick Test Function
test_endpoints() {
  echo -e "\n${YELLOW}[+] Testing Local Forwarded Endpoints...${NC}"
  
  echo -n "1. Audit Trail Telemetry API (Port ${LOCAL_API_PORT}): "
  if curl -s -k -m 3 "http://127.0.0.1:${LOCAL_API_PORT}/api/v1/telemetry" >/dev/null 2>&1; then
    echo -e "${GREEN}ONLINE [HTTP 200 OK]${NC}"
  else
    echo -e "${RED}OFFLINE / UNREACHABLE${NC}"
  fi

  echo -n "2. OpenTelemetry OTLP Port (Port ${LOCAL_OTEL_PORT}): "
  if nc -z 127.0.0.1 ${LOCAL_OTEL_PORT} >/dev/null 2>&1; then
    echo -e "${GREEN}LISTENING [READY]${NC}"
  else
    echo -e "${RED}OFFLINE / UNREACHABLE${NC}"
  fi

  echo -n "3. Sovereign Dashboard UI (Port ${LOCAL_UI_PORT}): "
  if curl -s -m 3 "http://127.0.0.1:${LOCAL_UI_PORT}" >/dev/null 2>&1; then
    echo -e "${GREEN}ONLINE [HTTP 200 OK]${NC}"
  else
    echo -e "${RED}OFFLINE / UNREACHABLE${NC}"
  fi
}

case "$2" in
  test)
    test_endpoints
    ;;
  *)
    start_tunnel
    ;;
esac
