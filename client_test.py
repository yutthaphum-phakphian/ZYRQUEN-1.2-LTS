import asyncio
import json
import os
import httpx
import websockets

PORT = os.environ.get("PORT", "3000")
BASE_URL = os.environ.get("BASE_URL", f"http://localhost:{PORT}")
WS_URL = os.environ.get("WS_URL", f"ws://localhost:{PORT}/ws/telemetry")

# Header สำหรับสิทธิ์ Sovereign Principal
HEADERS = {
    "X-Zyrquen-Sovereign-Sig": "EP-SOVEREIGN-01_DILITHIUM5_SIGNED_PROOF",
    "Content-Type": "application/json"
}

async def test_rest_api():
    async with httpx.AsyncClient(base_url=BASE_URL, headers=HEADERS, timeout=10.0) as client:
        # 1. Root Status Check
        res = await client.get("/")
        print(f"[✓] Root Status ({res.status_code}):", res.json()["status"])

        # 2. Telemetry Check
        res = await client.get("/api/v1/telemetry")
        print(f"[✓] Telemetry QOPS ({res.status_code}):", res.json()["qops"])

        # 3. Fetch Audit Records (Chamber 17)
        res = await client.get("/api/v1/audit/records?chamber_filter=Chamber%2017")
        print(f"[✓] Audit Records Count ({res.status_code}):", len(res.json()))

        # 4. Execute 12-Stage Trace Replay
        replay_payload = {"seal_id": 14902, "force_cold_replay": True}
        res = await client.post("/api/v1/forensic/trace-replay", json=replay_payload)
        print(f"[✓] Trace Replay Status ({res.status_code}):", res.json()["status"])

        # 5. Verify Gold Seal Integrity
        verify_payload = {
            "block_height": 849202,
            "expected_merkle_root": "909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68"
        }
        res = await client.post("/api/v1/gold-seal/verify", json=verify_payload)
        print(f"[✓] Gold Seal Verdict ({res.status_code}):", res.json()["verdict"])

        # 6. Generate Forensic Legal Report
        report_payload = {"block_height": 849202, "target_format": "PDF", "include_forensic_stream": True}
        res = await client.post("/api/v1/reports/generate", json=report_payload)
        print(f"[✓] Report Download URL ({res.status_code}):", res.json()["download_url"])

async def test_websocket_stream():
    print("\n[⚡] Starting WebSocket Live Telemetry Stream Listener (5 Messages)...")
    try:
        async with websockets.connect(WS_URL) as ws:
            for count in range(1, 6):
                message = await ws.recv()
                data = json.loads(message)
                print(f" └─ [Stream #{count}] Block #{data['block_height']} | QOPS: {data['qops']} | Temp: {data['cryo_temp']} | Drift: {data['drift']}")
    except Exception as e:
        print(f"[!] WebSocket Stream Error (Ensure WS endpoint is mounted): {e}")

async def main():
    print("==================================================")
    print(" ZYRQUEN Ω∞ SOVEREIGN SUITE - SYSTEM AUDIT TEST ")
    print("==================================================")
    await test_rest_api()
    await test_websocket_stream()
    print("==================================================")
    print(" ALL TESTS EXECUTED SUCCESSFULLY ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
