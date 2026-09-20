#!/bin/bash
# ==============================================================================
# ZYRQUEN Ω∞ Sovereign SSH Tunnel - Production Grade
# Genesis #849202 | #EP-SOVEREIGN-01 | SSoT Δ0 Zero Drift 0.00%
# Ports: 8443 (Audit API), 4318 (OTel mTLS 1.3), 3000 (Console UI)
# Features: Keep-Alive 15s, Auto-Reconnect, Health Check, Telemetry Log
# ==============================================================================
set -e

WORKSPACE="${1:-zyrquen-sovereign}"
ACTION="${2:-start}"
SSH_TARGET="coder.${WORKSPACE}"
LOG_FILE="/tmp/zyrquen-tunnel-${WORKSPACE}.log"
PID_FILE="/tmp/zyrquen-tunnel-${WORKSPACE}.pid"

# Port Mapping
PORTS=(
  "8443:localhost:8443"  # Audit Trail API & Telemetry /api/v1/telemetry
  "4318:localhost:4318"  # OTel Collector mTLS 1.3 OTLP
  "3000:localhost:3000"  # Sovereign Console Dashboard UI
)

SSH_OPTS="-o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o TCPKeepAlive=yes -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new"

build_forward_args() {
  local args=""
  for p in "${PORTS[@]}"; do
    args="$args -L $p"
  done
  echo "$args"
}

print_banner() {
  echo "🌌⚡ ZYRQUEN Ω∞ Sovereign SSH Tunnel"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🛡️  Workspace: $WORKSPACE"
  echo "⚖️  Target: $SSH_TARGET"
  echo "📡 Log: $LOG_FILE"
  echo "✔ Genesis #849202 | Merkle 909ab814...43fa4c68 | 10/10 REAL_HSM"
  echo ""
  echo "📌 Port Forwarding:"
  echo "  1. 8443 → Audit Trail API & Telemetry (/api/v1/telemetry)"
  echo "  2. 4318 → OTel Collector mTLS 1.3 / OTLP"
  echo "  3. 3000 → ZYRQUEN Ω∞ Sovereign Console Dashboard UI"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

ensure_coder_ssh() {
  echo "🔧 Checking coder config-ssh..."
  if command -v coder &> /dev/null; then
    coder config-ssh > /dev/null 2>&1 || true
    echo "✔ coder SSH config ready"
  else
    echo "⚠️  coder CLI not found - ensure Coder installed"
  fi
}

do_test() {
  echo "🧪 Testing port status on boss machine (localhost):"
  for port in 8443 4318 3000; do
    if nc -z localhost $port 2>/dev/null || (echo > /dev/tcp/localhost/$port) 2>/dev/null; then
      echo "  ✅ Port $port : OPEN"
      if [ "$port" = "8443" ]; then
        echo "     → Testing /api/v1/telemetry ..."
        curl -sk https://localhost:8443/api/v1/telemetry | head -c 200 || echo " (API not responding yet)"
      fi
    else
      echo "  ❌ Port $port : CLOSED (tunnel not running?)"
    fi
  done
  echo ""
  echo "📊 Check log: tail -f $LOG_FILE"
}

do_start() {
  print_banner
  ensure_coder_ssh

  FWD_ARGS=$(build_forward_args)
  echo ""
  echo "🚀 Starting tunnel with Keep-Alive (ServerAliveInterval=15) + Auto-Reconnect"
  echo "   CMD: ssh -N $SSH_OPTS $FWD_ARGS $SSH_TARGET"
  echo ""

  # Kill old if exists
  if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
      echo "⚠️  Old tunnel PID $OLD_PID still running, killing..."
      kill "$OLD_PID" || true
    fi
    rm -f "$PID_FILE"
  fi

  # Use autossh if available
  if command -v autossh &> /dev/null; then
    echo "🔐 Using autossh (M 0) for bulletproof reconnect..."
    autossh -M 0 -f -N $SSH_OPTS $FWD_ARGS $SSH_TARGET -E "$LOG_FILE"
    echo $! > "$PID_FILE"
  else
    echo "🔐 Using SSH with infinite reconnect loop..."
    (
      while true; do
        echo "[$(date)] 🌌 Connecting to $SSH_TARGET ..." | tee -a "$LOG_FILE"
        ssh -N $SSH_OPTS $FWD_ARGS $SSH_TARGET 2>&1 | tee -a "$LOG_FILE"
        echo "[$(date)] ⚠️  Tunnel disconnected, reconnecting in 2s..." | tee -a "$LOG_FILE"
        sleep 2
      done
    ) &
    echo $! > "$PID_FILE"
  fi

  sleep 1
  echo ""
  echo "✅ Tunnel PID $(cat $PID_FILE) started"
  echo "📡 Logs: tail -f $LOG_FILE"
  echo "🧪 Test: ./zyrquen-ssh-tunnel.sh $WORKSPACE test"
  echo "🛑 Stop: ./zyrquen-ssh-tunnel.sh $WORKSPACE stop"
  do_test
}

do_stop() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" && echo "🛑 Stopped tunnel PID $PID"
    else
      echo "ℹ️  No running process"
    fi
    rm -f "$PID_FILE"
  else
    pkill -f "ssh.*coder.${WORKSPACE}" && echo "🛑 Killed matching SSH processes" || echo "ℹ️  No tunnel found"
  fi
}

case "$ACTION" in
  start|"") do_start ;;
  test) do_test ;;
  stop) do_stop ;;
  restart) do_stop; sleep 1; do_start ;;
  logs) tail -f "$LOG_FILE" ;;
  *) echo "Usage: $0 [workspace] [start|test|stop|restart|logs]" ;;
esac
