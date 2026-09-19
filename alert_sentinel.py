import httpx

class SovereignAlertSentinel:
    def __init__(self, webhook_url: str = None):
        self.webhook_url = webhook_url

    async def dispatch_anomaly_alert(self, event_type: str, risk_index: float, chamber: str, details: str):
        """ส่งข้อความแจ้งเตือนผ่าน Webhook เข้ากลุ่มพฤติการณ์สุ่มเสี่ยง (Fail-Closed Quarantine)"""
        payload = {
            "text": (
                f"🚨 **ZYRQUEN SECURITY SENTINEL INTERCEPT** 🚨\n"
                f"• Event Type: {event_type}\n"
                f"• Target Chamber: {chamber}\n"
                f"• Detected Risk Index: {risk_index}\n"
                f"• Execution Status: Isolated via Fail-Closed Guard\n"
                f"• Detail Log: {details}"
            )
        }
        
        # แสดงผล Log บน Console
        print(f"[SENTINEL ALERT] Triggered on {chamber} | Risk: {risk_index} | {details}")
        
        # ส่งข้อมูลเข้า Webhook (เช่น Discord / Slack / Teams)
        if self.webhook_url:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    await client.post(self.webhook_url, json=payload)
            except Exception as e:
                print(f"[!] Webhook delivery error: {e}")
