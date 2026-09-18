import fs from 'fs';

let serverCode = fs.readFileSync('server.ts', 'utf-8');

const newData = `
const FORENSIC_12_STAGES_DATA = [
    {
        "time": "0.00ms",
        "stage": "INGRESS",
        "title": "Chamber 11 API Gateway Hit",
        "details": "Payload: Nc×Vc 36.22M | Sig: Dilithium-5 #EP-SOVEREIGN-01 | IP: 203.0.113.44",
        "status": "SUSPICIOUS-ATTACKER"
    },
    {
        "time": "0.08ms",
        "stage": "L1 GATE",
        "title": "ม.9 IAL1/AAL1 Verification",
        "details": "Bearer token authenticated successfully.",
        "status": "PASS"
    },
    {
        "time": "0.15ms",
        "stage": "L2 GATE",
        "title": "ม.26 IAL2+/AAL2+ Signature Check",
        "details": "Quantum resistant ML-DSA-87 signature match.",
        "status": "PASS"
    },
    {
        "time": "0.22ms",
        "stage": "SENTINEL AI",
        "title": "OTel Stream Anomaly Scan",
        "details": "Voltage Jitter Detected + Geo Mismatch BKK→Unknown | Risk Score 0.94 (Thresh 0.85)",
        "status": "CRITICAL 0.94"
    },
    {
        "time": "0.34ms",
        "stage": "L3 GATE",
        "title": "ม.28 10/10 REAL_HSM Quorum CHECK",
        "details": "TC-01..TC-10 Voting: 9/10 DENY (TC-09 Chaos Node reports Tamper Foil anomaly)",
        "status": "HOLD / DENY"
    },
    {
        "time": "0.48ms",
        "stage": "ZEROIZATION",
        "title": "Active Zeroization Triggered on TC-09",
        "details": "Dilithium-5 Ephemeral RAM Wiped <1.2ms → Completed in 0.48ms",
        "status": "WIPED ✅"
    },
    {
        "time": "0.85ms",
        "stage": "LOCKDOWN",
        "title": "Fail-Closed Lockdown Engaged",
        "details": "X-Zyrquen-Sovereign-Sig INVALID → Transaction Cut → Redirected to Chamber 02 Buffer",
        "status": "TX CUT"
    },
    {
        "time": "1.20ms",
        "stage": "PRESERVATION",
        "title": "Module 17 V24 Forensics Preservation",
        "details": "Raw Evidence Cloned | Zero-Deletion Guarantee 100%",
        "status": "PRESERVED"
    },
    {
        "time": "35.80ms",
        "stage": "TRACE REPLAY",
        "title": "12-Stage Trace Replay Complete",
        "details": "STAGE-01 INGEST → STAGE-12 CLOSURE | Drift 0.00% SSoT Δ0 | Seal 14,902 VERIFIED",
        "status": "COURT READY"
    }
];
`;

serverCode = serverCode.replace(
    /app\.post\(\['\/api\/v1\/forensic\/trace-replay', '\/api\/v1\/audit\/replay'\], \(req, res\) => {[\s\S]*?res\.json\(\{[\s\S]*?\}\);\n}\);/m,
    `app.get('/api/v1/forensic/trace-replay', (req, res) => {\n  res.json({\n    incident_id: "INC-094-CHAOS",\n    timestamp: new Date().toISOString(),\n    stages: FORENSIC_12_STAGES_DATA,\n    resolution: "FAIL_CLOSED_SSOT_PRESERVED"\n  });\n});`
);

// insert data if missing
if (!serverCode.includes('FORENSIC_12_STAGES_DATA')) {
    serverCode = newData + "\n" + serverCode;
}

fs.writeFileSync('server.ts', serverCode);
