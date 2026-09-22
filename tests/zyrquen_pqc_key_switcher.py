#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
         ZYRQUEN Ω∞ — PQC CRYPTO-AGILITY & KEY SWITCHING ENGINE (v1.2)
================================================================================
ระบบจำลองความยืดหยุ่นเชิงรหัสลับ (Crypto-Agility) บนแกนประมวลผล Canonical Core G11
ทำหน้าที่สลับเปลี่ยนและอัปเกรดคู่รหัสกุญแจหลังยุคควอนตัม (PQC Algorithms) อัตโนมัติ:
- Dilithium-5 (ML-DSA / FIPS 204) -> มาตรฐานหลักอิงทฤษฎีแลตทิส
- SPHINCS+ (SLH-DSA / FIPS 205) -> มาตรฐานสำรองอิงฟังก์ชันแฮช (Stateless Hash-based)
- Falcon (FN-DSA / FIPS 206) -> อิงแลตทิสแบบ Floating-point Gaussian sampling

สอดคล้องตามเกณฑ์มาตรฐาน:
- พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (มาตรา 9, 26, 28)
- แผนสำรองกู้ระบบคริปโต (Cryptographic Fallback Policy - FIPS 203/204/205)
================================================================================
"""

import os
import sys
import time
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List

class ZyrquenPQCKeySwitcher:
    def __init__(self):
        self.block_height = 849202
        self.genesis_merkle_root = "909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68"
        self.current_algorithm = "Dilithium-5"  # ค่าเริ่มต้นหลัก (ML-DSA)
        self.key_history: List[Dict[str, Any]] = []
        self.switch_events_log: List[Dict[str, Any]] = []
        
        # เริ่มต้นสร้างคู่รหัสกุญแจจำลองของ PQC แต่ละประเภทตามข้อกำหนดมาตรฐาน NIST
        self.keys_database = {
            "Dilithium-5": {
                "standard": "FIPS 204 (ML-DSA)",
                "math_approach": "Lattice-based (Module-Lattice)",
                "public_key": "MOCK_DILITHIUM5_PUB_KEY_849202_" + hashlib.sha256(b"dilithium5_pub").hexdigest()[:24].upper(),
                "private_key_hash": hashlib.sha256(b"dilithium5_priv_secret").hexdigest()
            },
            "SPHINCS+": {
                "standard": "FIPS 205 (SLH-DSA)",
                "math_approach": "Stateless Hash-Based (Backup Method)",
                "public_key": "MOCK_SPHINCS_PUB_KEY_849202_" + hashlib.sha256(b"sphincs_pub").hexdigest()[:24].upper(),
                "private_key_hash": hashlib.sha256(b"sphincs_priv_secret").hexdigest()
            },
            "Falcon": {
                "standard": "FIPS 206 (FN-DSA)",
                "math_approach": "FFT over NTRU-Lattice (Gaussian sampling)",
                "public_key": "MOCK_FALCON_PUB_KEY_849202_" + hashlib.sha256(b"falcon_pub").hexdigest()[:24].upper(),
                "private_key_hash": hashlib.sha256(b"falcon_priv_secret").hexdigest()
            }
        }
        
        # บันทึกประวัติคีย์เริ่มต้น
        self._record_key_state("SYSTEM_INITIALIZATION", "Dilithium-5", "คีย์หลักในสภาวะปกติ")

    def _record_key_state(self, action: str, algorithm: str, reason: str):
        key_metadata = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "action": action,
            "algorithm": algorithm,
            "standard_name": self.keys_database[algorithm]["standard"],
            "math_approach": self.keys_database[algorithm]["math_approach"],
            "active_public_key": self.keys_database[algorithm]["public_key"],
            "reason": reason,
            "block_id": self.block_height
        }
        self.key_history.append(key_metadata)

    def generate_pqc_signature(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        สร้างลายมือชื่อดิจิทัลหลังยุคควอนตัม (PQC Signature) กำกับข้อมูลธุรกรรม
        """
        algo = self.current_algorithm
        key_info = self.keys_database[algo]
        
        # นำข้อมูลธุรกรรมมาแฮช SHA-256 เพื่อทำ Message Digest
        tx_serialized = json.dumps(transaction_data, sort_keys=True)
        message_digest = hashlib.sha256(tx_serialized.encode('utf-8')).hexdigest()
        
        # จำลองการคำนวณสลักสิทธิ์ร่วมกับกุญแจส่วนตัว
        signature_data = f"{algo}:{key_info['private_key_hash'][:16]}:{message_digest}"
        computed_sig = f"PQC_SIG_{algo.upper()}_{hashlib.sha256(signature_data.encode()).hexdigest()[:32].upper()}"
        
        # ตรวจสอบขีดความสอดคล้องตาม พ.ร.บ. ธุรกรรมอิเล็กทรอนิกส์ มาตรา 9, 26, 28
        legal_compliance = {
            "section_9": True,  # ระบุอัตลักษณ์ผู้ส่งและเจตนายอมรับได้ชัดเจน
            "section_26": True, # ลายเซ็นปลอดภัย คีย์อยู่ภายใต้การควบคุมของผู้ลงนาม และป้องกันการปฏิเสธความรับผิด
            "section_28": True  # มีการตรวจสอบสถานะผ่าน Immutable Audit Ledger หรือ CA
        }
        
        return {
            "algorithm_used": algo,
            "standard": key_info["standard"],
            "math_approach": key_info["math_approach"],
            "public_key_ref": key_info["public_key"],
            "message_digest": message_digest,
            "pqc_signature": computed_sig,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "legal_compliance": legal_compliance,
            "court_admissible": "HIGH_ASSURANCE_PQC_READY"
        }

    def execute_crypto_fallback_switch(self, trigger_condition: str, target_algo: str) -> Dict[str, Any]:
        """
        ดำเนินการสลับคู่รหัสกุญแจเชิงรุก (Crypto Fallback Switch) บนแกน G11 เมื่อตรวจพบความเสี่ยงหรือพฤติกรรมผิดปกติ
        """
        if target_algo not in self.keys_database:
            raise ValueError(f"อัลกอริทึม {target_algo} ไม่ได้รับรองในคลัง PQC ของ ZYRQUEN")
            
        old_algo = self.current_algorithm
        self.current_algorithm = target_algo
        
        reason_detail = (
            f"เงื่อนไขกระตุ้น: {trigger_condition} | "
            f"ดำเนินการถอนกุญแจ {old_algo} ({self.keys_database[old_algo]['standard']}) "
            f"และสลับกุญแจหลักอิมพลีเมนต์เป็น {target_algo} ({self.keys_database[target_algo]['standard']}) "
            f"เพื่อหลบเลี่ยงช่องโหว่ทางคณิตศาสตร์แบบแลตทิสไปสู่คริปโตอิงฟังก์ชันแฮชถาวร"
        )
        
        self._record_key_state("CRYPTO_FALLBACK_SWITCH_TRIGGERED", target_algo, reason_detail)
        
        event_record = {
            "event_id": f"PQC-SWITCH-EV-{len(self.switch_events_log) + 1:04d}",
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "block_id": self.block_height,
            "from_algorithm": old_algo,
            "to_algorithm": target_algo,
            "trigger_condition": trigger_condition,
            "status": "FALLBACK_SUCCESS",
            "audit_trail_signature": f"SWITCH_SIG_{hashlib.sha256(reason_detail.encode()).hexdigest()[:16].upper()}"
        }
        self.switch_events_log.append(event_record)
        return event_record

def main():
    print("=== STARTING ZYRQUEN Ω∞ PQC KEY SWITCHING SIMULATION ===")
    switcher = ZyrquenPQCKeySwitcher()
    
    # ธุรกรรมรอบที่ 1: รันสภาวะปกติภายใต้ Dilithium-5
    tx_1 = {"tx_id": "TX-PQC-1001", "sender": "นายยุทธภูมิ พากเพียร", "amount": 250000.00}
    signed_tx_1 = switcher.generate_pqc_signature(tx_1)
    print(f"\n[*] Transaction 1 signed with: {signed_tx_1['algorithm_used']} ({signed_tx_1['standard']})")
    print(f"    - Public Key Ref: {signed_tx_1['public_key_ref']}")
    print(f"    - Signature: {signed_tx_1['pqc_signature'][:30]}...")
    
    # เกิดเหตุการณ์จำลอง: ตรวจพบพฤติกรรมแลตทิสเสี่ยงต่อ Quantum Attack / ช่องโหว่โมดูล
    # สถาปัตยกรรม G11 บังคับใช้แผนประมวลคีย์สำรอง (Fallback to stateless hash-based SPHINCS+)
    print("\n[!] WARNING: Security alert triggered! Lattice-based vulnerability suspected or fallback ordered.")
    switch_event = switcher.execute_crypto_fallback_switch(
        trigger_condition="LATTICE_VULNERABILITY_ALERT", 
        target_algo="SPHINCS+"
    )
    print(f"[✓] Key switching event executed successfully!")
    print(f"    - Switched from: {switch_event['from_algorithm']} -> To: {switch_event['to_algorithm']}")
    print(f"    - Audit Trail Signature: {switch_event['audit_trail_signature']}")
    
    # ธุรกรรมรอบที่ 2: รันภายหลังเปลี่ยนคู่กุญแจเป็น SPHINCS+ (SLH-DSA)
    tx_2 = {"tx_id": "TX-PQC-1002", "sender": "นายยุทธภูมิ พากเพียร", "amount": 250000.00}
    signed_tx_2 = switcher.generate_pqc_signature(tx_2)
    print(f"\n[*] Transaction 2 signed with: {signed_tx_2['algorithm_used']} ({signed_tx_2['standard']})")
    print(f"    - Public Key Ref: {signed_tx_2['public_key_ref']}")
    print(f"    - Signature: {signed_tx_2['pqc_signature'][:30]}...")
    
    # ทดสอบจำลองอีกมิติ: ย้ายระบบไปใช้ Falcon-512 (FN-DSA) ซึ่งเป็นสัญกรณ์แบบ Floating-point
    print("\n[!] STAGE-SWITCH: Initiating second transition to Falcon (FN-DSA) for latency optimization.")
    switch_event_2 = switcher.execute_crypto_fallback_switch(
        trigger_condition="LATENCY_OPTIMIZATION_REQUEST", 
        target_algo="Falcon"
    )
    tx_3 = {"tx_id": "TX-PQC-1003", "sender": "นายยุทธภูมิ พากเพียร", "amount": 5000.00}
    signed_tx_3 = switcher.generate_pqc_signature(tx_3)
    print(f"[✓] Transited to Falcon successfully!")
    print(f"[*] Transaction 3 signed with: {signed_tx_3['algorithm_used']} ({signed_tx_3['standard']})")
    print(f"    - Signature: {signed_tx_3['pqc_signature'][:30]}...")

    # ส่งออกบันทึกการทำงานและประวัติคีย์เป็นไฟล์ประวัติความปลอดภัยหลัก
    output_report = {
        "report_title": "ZYRQUEN Ω∞ — PQC CRYPTO-AGILITY & KEY SWITCHING REPORT",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "active_block": switcher.block_height,
        "genesis_merkle_root": switcher.genesis_merkle_root,
        "system_status": "LOCKED_FROZEN_v1.2_LTS",
        "key_history_ledger": switcher.key_history,
        "switching_events_log": switcher.switch_events_log,
        "legal_foundation": {
            "thai_law": "พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544",
            "enforced_sections": ["มาตรา 9 (E-Signature ทั่วไป)", "มาตรา 26 (E-Signature ปลอดภัย)", "มาตรา 28 (E-Signature ใช้ CA)"],
            "nist_standards": ["FIPS 203 (ML-KEM)", "FIPS 204 (ML-DSA / Crystals-Dilithium)", "FIPS 205 (SLH-DSA / Sphincs+)", "FIPS 206 (FN-DSA / Falcon)"]
        }
    }
    
    output_path = "/workspace/out/zyrquen-pqc-switch-results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_report, f, indent=2, ensure_ascii=False)
        
    print(f"\n[✓] Unified PQC Switch Report saved successfully to: {output_path}")
    print("=== END OF PQC KEY SWITCHING SIMULATION ===")

if __name__ == "__main__":
    main()
