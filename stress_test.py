import asyncio
import os
import time
import httpx

PORT = os.environ.get("PORT", "3000")
TARGET_URL = os.environ.get("TARGET_URL", f"http://localhost:{PORT}")
TOTAL_REQUESTS = 200
CONCURRENCY_LIMIT = 20

HEADERS = {
    "X-Zyrquen-Sovereign-Sig": "EP-SOVEREIGN-01_DILITHIUM5_SIGNED_PROOF",
    "Content-Type": "application/json"
}

async def send_worker_task(client: httpx.AsyncClient, semaphore: asyncio.Semaphore, stats: dict):
    async with semaphore:
        start_t = time.perf_counter()
        try:
            # ทดสอบเรียกสอบทาน Trace Replay 12-Stage
            payload = {"seal_id": 14902, "force_cold_replay": True}
            res = await client.post("/api/v1/forensic/trace-replay", json=payload)
            elapsed = time.perf_counter() - start_t
            
            if res.status_code == 200:
                stats["success"] += 1
                stats["latencies"].append(elapsed)
            else:
                stats["failed"] += 1
        except Exception:
            stats["failed"] += 1

async def run_stress_test():
    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    stats = {"success": 0, "failed": 0, "latencies": []}
    
    async with httpx.AsyncClient(base_url=TARGET_URL, headers=HEADERS, timeout=15.0) as client:
        start_time = time.perf_counter()
        tasks = [send_worker_task(client, semaphore, stats) for _ in range(TOTAL_REQUESTS)]
        await asyncio.gather(*tasks)
        total_time = time.perf_counter() - start_time

    qops = stats["success"] / total_time if total_time > 0 else 0
    avg_lat = (sum(stats["latencies"]) / len(stats["latencies"])) * 1000 if stats["latencies"] else 0

    print("==================================================")
    print(" ZYRQUEN Ω∞ STRESS TEST METRICS RESULTS ")
    print("==================================================")
    print(f" Total Requests Delivered : {TOTAL_REQUESTS}")
    print(f" Concurrent Workers       : {CONCURRENCY_LIMIT}")
    print(f" Successful Verification : {stats['success']}")
    print(f" Failed Invocations      : {stats['failed']}")
    print(f" Total Execution Time     : {total_time:.2f} s")
    print(f" Measured Throughput      : {qops:.1f} QOPS")
    print(f" Average Latency          : {avg_lat:.2f} ms")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
