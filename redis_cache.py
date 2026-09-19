import json
import redis.asyncio as aioredis

class MerkleCacheManager:
    def __init__(self, redis_url: str = "redis://zyrquen_redis_cache:6379"):
        self.redis_url = redis_url
        self.redis = None

    async def init_redis(self):
        """เริ่มต้นการเชื่อมต่อแบบ Async Redis Client"""
        try:
            self.redis = await aioredis.from_url(
                self.redis_url, 
                encoding="utf-8", 
                decode_responses=True
            )
        except Exception as e:
            print(f"[!] Redis initialization warning (continuing in-memory): {e}")
            self.redis = None

    async def get_cached_proof(self, seal_id: int):
        """ดึงข้อมูล Merkle Proof จาก Cache"""
        if not self.redis:
            return None
        try:
            cache_key = f"merkle:proof:{seal_id}"
            cached_data = await self.redis.get(cache_key)
            return json.loads(cached_data) if cached_data else None
        except Exception:
            return None

    async def set_cached_proof(self, seal_id: int, proof_data: dict, ttl: int = 3600):
        """บันทึก Merkle Proof ลง Cache กำหนด TTL 1 ชั่วโมง"""
        if not self.redis:
            return
        try:
            cache_key = f"merkle:proof:{seal_id}"
            await self.redis.set(cache_key, json.dumps(proof_data), ex=ttl)
        except Exception:
            pass
