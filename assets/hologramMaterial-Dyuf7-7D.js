import{C as n,h as s,A as l,q as m,g as u,D as d}from"./vendor-three-ut4vF-jm.js";function p(i={}){const a=new n(i.primaryColor||"#06b6d4"),e=new n(i.secondaryColor||"#8b5cf6");return new s({uniforms:{uTime:{value:0},uPrimaryColor:{value:a},uSecondaryColor:{value:e},uOpacity:{value:i.opacity??.65},uGlitch:{value:i.glitchIntensity??0},uGravityCenter:{value:new m(0,0)},uGravityStrength:{value:i.gravityStrength??0}},vertexShader:`
      varying vec3 vPosition;
      varying vec2 vUv;
      varying float vGravityInfluence;
      uniform float uTime;
      uniform float uGlitch;
      uniform vec2 uGravityCenter;
      uniform float uGravityStrength;

      void main() {
        vUv = uv;
        vec3 pos = position;
        // Subtle harmonic wave across the multiverse lattice
        pos.y += sin(pos.x * 0.8 + uTime * 1.8) * 0.12 + cos(pos.z * 0.8 + uTime * 1.4) * 0.12;

        // Mouse-following 3D Gravitational Well Distortion
        vec2 delta = pos.xz - uGravityCenter;
        float dist = length(delta);
        float well = exp(-dist * dist * 0.18) * uGravityStrength;
        pos.y -= well * 1.65;
        if (dist > 0.001) {
          pos.xz -= normalize(delta) * well * 0.42;
        }
        vGravityInfluence = well;

        if (uGlitch > 0.01) {
          pos.x += sin(uTime * 45.0 + pos.z * 4.0) * uGlitch * 0.25;
        }
        vPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,fragmentShader:`
      varying vec3 vPosition;
      varying vec2 vUv;
      varying float vGravityInfluence;
      uniform float uTime;
      uniform vec3 uPrimaryColor;
      uniform vec3 uSecondaryColor;
      uniform float uOpacity;

      void main() {
        float mixFactor = 0.5 + 0.5 * sin(vPosition.x * 0.25 + vPosition.z * 0.25 + uTime);
        vec3 baseColor = mix(uPrimaryColor, uSecondaryColor, mixFactor);
        vec3 gravityGlow = vec3(0.83, 0.68, 0.21); // Sovereign Gold highlight in gravity well
        vec3 color = mix(baseColor, gravityGlow, clamp(vGravityInfluence * 0.85, 0.0, 1.0));
        float scanline = 0.85 + 0.15 * sin(vPosition.y * 18.0 - uTime * 6.0);
        gl_FragColor = vec4(color * scanline, min(1.0, uOpacity + vGravityInfluence * 0.3));
      }
    `,transparent:!0,wireframe:!0,depthWrite:!1,blending:l})}function A(i){const e=(i||[{x:0,z:0,intensity:.99,radius:2.6},{x:-3.8,z:-2.6,intensity:.96,radius:2.3},{x:4.1,z:-2.2,intensity:.94,radius:2.2},{x:-3.5,z:2.8,intensity:.88,radius:2},{x:3.6,z:3.1,intensity:.97,radius:2.4},{x:.4,z:-4.2,intensity:.91,radius:2.1}]).slice(0,6).map(t=>new u(t.x,t.z,t.intensity,t.radius));for(;e.length<6;)e.push(new u(0,0,.5,1.5));return new s({uniforms:{uTime:{value:0},uSweepAngleRad:{value:0},uHotspots:{value:e},uFluxThreshold:{value:0},uOpacity:{value:.82},uPaletteMode:{value:0}},vertexShader:`
      varying vec2 vUv;
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform vec4 uHotspots[6];

      void main() {
        vUv = uv;
        vec3 pos = position;
        float heatElevation = 0.0;
        for (int i = 0; i < 6; i++) {
          vec2 d = pos.xz - uHotspots[i].xy;
          float r = max(0.5, uHotspots[i].w);
          float g = exp(-dot(d, d) / (r * r)) * uHotspots[i].z;
          heatElevation += g;
        }
        pos.y += min(0.65, heatElevation * 0.28) + sin(pos.x * 1.2 + uTime * 2.4) * 0.04;
        vWorldPos = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,fragmentShader:`
      varying vec2 vUv;
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform float uSweepAngleRad;
      uniform vec4 uHotspots[6];
      uniform float uFluxThreshold;
      uniform float uOpacity;
      uniform int uPaletteMode;

      void main() {
        float totalHeat = 0.0;
        for (int i = 0; i < 6; i++) {
          vec2 delta = vWorldPos.xz - uHotspots[i].xy;
          float radius = max(0.5, uHotspots[i].w);
          float pulse = 0.92 + 0.08 * sin(uTime * 3.2 + float(i) * 1.3);
          float contrib = exp(-dot(delta, delta) / (radius * radius * 0.65)) * uHotspots[i].z * pulse;
          totalHeat += contrib;
        }

        totalHeat = clamp(totalHeat, 0.0, 1.35);
        if (totalHeat < uFluxThreshold) {
          discard;
        }

        // Hologram surface sub-grid lines
        vec2 grid = abs(fract(vWorldPos.xz * 0.85 - 0.5) - 0.5) / fwidth(vWorldPos.xz * 0.85);
        float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);

        // Radar polar sweep wave boost
        float angle = atan(vWorldPos.z, vWorldPos.x);
        float angleDiff = mod(angle - uSweepAngleRad + 6.28318, 6.28318);
        float sweepBoost = smoothstep(1.2, 0.0, angleDiff) * 0.22;

        // Multi-stop thermal color ramp: Cyan (low) -> Violet (high) -> Sovereign Gold (peak)
        vec3 lowColor = uPaletteMode == 1 ? vec3(0.06, 0.72, 0.50) : vec3(0.02, 0.71, 0.83);
        vec3 midColor = uPaletteMode == 1 ? vec3(0.96, 0.62, 0.04) : vec3(0.55, 0.36, 0.96);
        vec3 peakColor = uPaletteMode == 1 ? vec3(0.94, 0.27, 0.27) : vec3(0.83, 0.68, 0.21);

        vec3 heatColor = mix(lowColor, midColor, smoothstep(0.15, 0.65, totalHeat));
        heatColor = mix(heatColor, peakColor, smoothstep(0.68, 1.15, totalHeat));
        heatColor += vec3(0.12, 0.85, 0.95) * gridLine * 0.28 + sweepBoost;

        float alpha = clamp((totalHeat * 0.68 + gridLine * 0.16 + sweepBoost) * uOpacity, 0.0, 0.92);
        gl_FragColor = vec4(heatColor, alpha);
      }
    `,transparent:!0,side:d,depthWrite:!1,blending:l})}const g=[{id:"gw-log-01",timestamp:"07:45:12 ICT",dimensionCode:"DIM-00",gatewayName:"Sovereign-Root-Gateway",previousState:"INITIALIZING",newState:"UNIFIED_LOCKED",latencyMs:1.2,quorumSignature:"10/10 REAL_HSM (Dilithium-5)",merkleProof:"0x909ab814...fa4c68",actor:"#EP-SOVEREIGN-01"},{id:"gw-log-02",timestamp:"07:46:04 ICT",dimensionCode:"DIM-01",gatewayName:"Unifier-Bridge-Mk3",previousState:"SYNCING",newState:"UNIFIED_ZERO_DRIFT",latencyMs:3.4,quorumSignature:"10/10 REAL_HSM (Dilithium-5)",merkleProof:"0x7e4a91bc...32d108",actor:"QuantumRuntimeUnifier"},{id:"gw-log-03",timestamp:"07:46:38 ICT",dimensionCode:"DIM-02",gatewayName:"FailClosed-Airgap-Gate",previousState:"INSPECTING",newState:"STANDBY_BUFFER (80 Seals)",latencyMs:.8,quorumSignature:"10/10 REAL_HSM (SPHINCS+)",merkleProof:"0x43fa4c68...909ab8",actor:"Chamber02BufferGamma"},{id:"gw-log-04",timestamp:"07:47:15 ICT",dimensionCode:"DIM-09",gatewayName:"OTLP-mTLS-8443",previousState:"HANDSHAKE",newState:"ACTIVE_STREAM_8443",latencyMs:35.8,quorumSignature:"10/10 REAL_HSM (Kyber-1024)",merkleProof:"0x5b7f19e0...c4410a",actor:"TelemetryCore8443"},{id:"gw-log-05",timestamp:"07:47:42 ICT",dimensionCode:"DIM-10",gatewayName:"Nexus-Gateway-MkIII",previousState:"ROUTING_CHECK",newState:"SOVEREIGN_SHIELD_ARMED",latencyMs:11.2,quorumSignature:"10/10 REAL_HSM (Dilithium-5)",merkleProof:"0x3c9d08fa...849202",actor:"SovereignDimensionRouter"}];function C(i,a,e){const t=Math.max(0,Math.min(100,100-Math.max(0,i-30)*.55)),o=t*.3+a*.35+e*.35,r=Math.round(Math.max(0,Math.min(100,o))*10)/10;return r>=90?{score:r,tier:"SOVEREIGN_VERIFIED",tierLabel:"Sovereign Verified (90–100)",accentHex:"#8B5CF6",latencyScore:t,healingRatePct:a,stabilityIndexPct:e}:r>=75?{score:r,tier:"STRONG",tierLabel:"Strong Auto-Heal (75–89)",accentHex:"#06B6D4",latencyScore:t,healingRatePct:a,stabilityIndexPct:e}:r>=50?{score:r,tier:"MODERATE",tierLabel:"Moderate Recovery (50–74)",accentHex:"#F59E0B",latencyScore:t,healingRatePct:a,stabilityIndexPct:e}:{score:r,tier:"CRITICAL",tierLabel:"Critical Intervention (0–49)",accentHex:"#EF4444",latencyScore:t,healingRatePct:a,stabilityIndexPct:e}}function y(){return new s({uniforms:{uTime:{value:0},uGoldColor:{value:new n("#D4AF37")},uCyanColor:{value:new n("#06B6D4")},uTrustPulse:{value:1}},vertexShader:`
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        float scale = 1.0 + 0.035 * sin(uTime * 3.2);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
      }
    `,fragmentShader:`
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uGoldColor;
      uniform vec3 uCyanColor;
      uniform float uTrustPulse;

      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.8);
        float pulse = 0.5 + 0.5 * sin(uTime * 4.0 - length(vPosition) * 2.0);
        vec3 col = mix(uGoldColor, uCyanColor, fresnel * 0.45) * (0.85 + 0.35 * pulse * uTrustPulse);
        gl_FragColor = vec4(col, 0.88);
      }
    `,transparent:!0,wireframe:!0,blending:l})}function f(){return{principalName:"นายยุทธภูมิ พากเพียร",principalId:"#EP-SOVEREIGN-01",clearanceLevel:"OMEGA-1 SUPREME CLEARANCE",merkleAnchor:"909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68",genesisBlock:849202,hsmQuorum:"10/10 REAL_HSM",telemetryPort:8443,isolationBuffer:"Chamber 02 Buffer Gamma [STANDBY]",gateStatus:"VERIFIED_UNLOCKED"}}const S=[{id:"ws-01",name:"sovereign-core-engine",engineTarget:"ZYRQUEN Ω∞ Frozen Kernel v1.2 LTS",branch:"main@849202",merkleBinding:"909ab8144798...fa4c68",sealsBound:14902,status:"CONNECTED",latencyMs:35.8,description:"Primary SSoT Sovereign Kernel & 10/10 REAL_HSM Deca-Key Execution Plane"},{id:"ws-02",name:"multiverse-runtime-unifier",engineTarget:"Quantum Runtime Unifier Mk-III",branch:"continuum/v14-mk3",merkleBinding:"909ab8144798...fa4c68",sealsBound:14902,status:"SYNCED",latencyMs:12.4,description:"Unifies DIM-00..DIM-11 quantum state runtimes under zero-drift constraint"},{id:"ws-03",name:"navigation-grid-mk3",engineTarget:"Navigation Grid Mk-III & Dimension Router",branch:"grid/sector-08-xf4",merkleBinding:"909ab8144798...fa4c68",sealsBound:14902,status:"SYNCED",latencyMs:18.2,description:"3D Hologram Multiverse Traversal & Sovereign Dimension Router Gateway"},{id:"ws-04",name:"telemetry-core-8443",engineTarget:"Telemetry Core & Quantum Radar Mk-III",branch:"otel/tls-8443",merkleBinding:"909ab8144798...fa4c68",sealsBound:14902,status:"CONNECTED",latencyMs:35.8,description:"Realtime particle stream telemetry & OTLP mTLS port 8443 monitor"},{id:"ws-05",name:"chamber-02-buffer-gamma",engineTarget:"Chaos-Resilience & Isolation Quarantine Layer",branch:"quarantine/buffer-gamma",merkleBinding:"909ab8144798...fa4c68",sealsBound:80,status:"STANDBY_BUFFER",latencyMs:.8,description:"Chamber 02 Buffer Gamma [STANDBY] — 80 Quarantined Seals isolated from SSoT"},{id:"ws-06",name:"agentic-reasoning-mesh",engineTarget:"Python 3.12 AI Runtime · Sovereign Mesh Backend",branch:"mesh/agentic-128k",merkleBinding:"e3b0c44298fc...852b855",sealsBound:14902,status:"CONNECTED",latencyMs:18.42,description:"3 Orchestrated AI Agents · 16 CPU (68.4%) / 32GB RAM (78.2%) · Context 128k · FIPS 203/204 Enclave Ready"}],c=[{id:"INSPECT",stepNumber:1,label:"Inspect",labelTh:"ตรวจสอบโครงสร้าง Workspace",durationMs:4.2,status:"PASSED",command:"zyrquen phase11 inspect --workspace sovereign-core-engine",summary:"Scanned 18 Chambers, 14,902 Canonical Seals, and Telemetry Port 8443 bindings.",artifactHash:"0x909ab814...inspect01",details:["Target Workspace: sovereign-core-engine (Block #849202)","SSoT Baseline Drift: Δ0 = 0.000% (Read-Only Kernel Intact)","Isolation Buffer: Chamber 02 Buffer Gamma [STANDBY] (80 Seals Isolated)"]},{id:"DIAGNOSE",stepNumber:2,label:"Diagnose",labelTh:"วินิจฉัยคอขวดและจุดปรับปรุง",durationMs:5.8,status:"PASSED",command:"zyrquen phase11 diagnose --target telemetry-core-8443",summary:"Identified sub-millisecond jitter optimization opportunity on Dimension Router gateway.",artifactHash:"0x909ab814...diag02",details:["Current Replay Latency: 35.80 ms (SLA Target < 142.00 ms PASS)","HSM Quorum Health: 10/10 REAL_HSM (14.98 mK Cryo Stabilized)","Diagnosis: Dimension Router buffer prefetch can reduce P99 latency by 4.2ms without mutating SSoT."]},{id:"PROPOSAL",stepNumber:3,label:"Proposal",labelTh:"สร้างข้อเสนอการปรับแก้ (Non-Mutating)",durationMs:3.4,status:"PASSED",command:"zyrquen phase11 proposal --generate-diff",summary:"Generated Proposal #PROP-849202-11: Enable Quantum Runtime Unifier Prefetch in Layer-2 Sandbox.",artifactHash:"0x909ab814...prop03",details:["Proposal ID: PROP-849202-11 (Zero-Drift Overlay Patch)","Scope: multiverse-runtime-unifier & navigation-grid-mk3","Safety Guarantee: SSoT Δ0 = 0.000% preserved; Fail-Closed rollback armed."]},{id:"APPROVAL",stepNumber:4,label:"Approval",labelTh:"อนุมัติโดยผู้ถือสิทธิ์อธิปไตย (10/10 HSM)",durationMs:6.1,status:"PASSED",command:"zyrquen phase11 approve --principal #EP-SOVEREIGN-01 --quorum 10/10",summary:"Signed by นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) with 10/10 REAL_HSM Dilithium-5 Quorum.",artifactHash:"0x909ab814...appr04",details:["Principal Authority: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01 / OMEGA-1)","PQC Signature: NIST FIPS 204 ML-DSA-87 (Dilithium-5) + FIPS 205 SLH-DSA","Hardware Quorum: 10/10 REAL_HSM FIPS 140-3 Level 4 Unanimous Ratification"]},{id:"PATCH",stepNumber:5,label:"Patch",labelTh:"ประยุกต์แพตช์ลง Workspace เชื่อมต่อ",durationMs:4.5,status:"PASSED",command:"zyrquen phase11 patch --apply PROP-849202-11",summary:"Applied hot-swap runtime patch to sovereign-core-engine integration layer.",artifactHash:"0x909ab814...patch05",details:["Patched Modules: QuantumRuntimeUnifier, SovereignDimensionRouter, ChaosResilienceLayer","Kernel Mutation Count: 0 (Applied via Ephemeral Overlay Ring-3)","Rollback Anchor: Block #849202 Merkle 909ab814...fa4c68"]},{id:"TEST",stepNumber:6,label:"Test",labelTh:"รันชุดทดสอบนิติวิทยาศาสตร์และควอนตัม",durationMs:5.2,status:"PASSED",command:"zyrquen phase11 test --suite e2e-forensic-16",summary:"22/22 Verification Gates & 16/16 Forensic Pipeline Stages PASSED (0 regressions).",artifactHash:"0x909ab814...test06",details:["Unit & Integration Assertions: 1,024 / 1,024 PASSED","Chaos Fault Injection Test: Auto-Healed in 142ms (0 crashes)","PDPA Sec 37 & ETDA Sec 9/26/28 Statutory Checks: 100% COMPLIANT"]},{id:"BUILD",stepNumber:7,label:"Build",labelTh:"คอมไพล์อาร์ติแฟกต์แบบ Deterministic",durationMs:3.1,status:"PASSED",command:"zyrquen phase11 build --deterministic",summary:"Deterministic bundle compiled & hermetically sealed with reproducible SHA-256 digest.",artifactHash:"0x909ab814...build07",details:["Build Target: LOCKED_FROZEN_v1.2_LTS + Multiverse Mk-III","Reproducible Digest: sha256:909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68","Zero-Any TypeScript Policy: VERIFIED"]},{id:"VERIFY",stepNumber:8,label:"Verify",labelTh:"ทวนสอบ Merkle Root และ SSoT Δ0",durationMs:2,status:"PASSED",command:"zyrquen phase11 verify --merkle-anchor 909ab814",summary:"Verified Δ0 = 0.000% Zero Drift, 14,902 Canonical Seals, and 35.80 ms Replay SLA.",artifactHash:"0x909ab814...ver08",details:["Merkle Root Match: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68 (100% EXACT)","Telemetry Port 8443 Handshake: ACTIVE (35.80 ms)","Chamber 02 Buffer Gamma: [STANDBY] (80 Quarantined Seals Contained)"]},{id:"AUDIT",stepNumber:9,label:"Audit",labelTh:"ประทับตราบันทึกนิติวิทยาศาสตร์ (WORM)",durationMs:1.5,status:"PASSED",command:"zyrquen phase11 audit --seal-worm-ledger",summary:"Phase 11 execution sealed to WORM Ledger under RFC 3161 NIMT TSA & Certificate ZQ-GOLD-DEP-849202-3908.",artifactHash:"0x909ab814...audit09",details:["Total Pipeline Latency: 35.80 ms (SLA < 142.00 ms PASS)","Attestation Certificate: ZQ-GOLD-DEP-849202-3908","Court Admissibility: ISO/IEC 27037 & Thai ETDA Sec 9, 26, 28 Ready"]}];function T(i){const a=i.trim(),e=a.toLowerCase();if(e==="status"||e==="zyrquen status")return{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN INTEGRATION PATH: Cloud Command Center → sovereign-core-engine → ZYRQUEN CLI]
# ======================================================================
• Engine Target:    sovereign-core-engine (ZYRQUEN Ω∞ FROZEN v1.2 LTS)
• SSoT Drift:       Δ0 = 0.000% (Strict Zero-Drift Baseline)
• Genesis Block:    #849202
• Merkle Root:      909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
• Canonical Seals:  14,902 Verified (99.47% Integrity Score)
• HSM Quorum:       10/10 REAL_HSM (FIPS 140-3 Level 4 @ 14.98 mK)
• Telemetry Port:   8443 (OTLP/mTLS Active Stream)
• Latency:          35.80 ms (SLA Target < 142.00 ms PASS)
• Isolation Buffer: Chamber 02 Buffer Gamma [STANDBY] (80 Quarantined Seals)
• Principal:        นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01 / OMEGA-1)`};if(e==="workspace list"||e==="workspaces"||e==="ws list"){const t=S.map((o,r)=>`  ${r+1}. [${o.status}] ${o.name.padEnd(28," ")} | Branch: ${o.branch.padEnd(18," ")} | Seals: ${o.sealsBound.toLocaleString().padEnd(6," ")} | Latency: ${o.latencyMs.toFixed(2)} ms
     ↳ ${o.description}`).join(`
`);return{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN CLI → WORKSPACE LIST (sovereign-core-engine Integration Layer)]
# ======================================================================
Connected Workspaces (5 Active Bindings | Anchor #849202 | Merkle 909ab814...fa4c68):
${t}
# ======================================================================
• SSoT Sync Status: 100% Bidirectional Match with Overview | Δ0 = 0.000%`}}if(e==="resources"||e==="resource"||e==="zyrquen resources")return{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN CLI → SYSTEM RESOURCES & QUANTUM TELEMETRY (sovereign-core-engine)]
# ======================================================================
• Compute & Cryo Core:  4x Sovereign Quantum-Hybrid Cores (Load: 41.2% Nominal)
• Memory Allocation:    5,214 MB / 16,384 MB ECC WORM-Protected RAM (Vault: 1,024 TB)
• Cryostat Thermal:     14.98 mK Sub-Kelvin Helium-3/Helium-4 (Circuit Breaker: 85.0°C)
• Quantum Register:     768 Qubits | Coherence Index: 99.97% | Energy Dispatch: 851.9 QOps/s
• HSM Hardware Cluster: 10/10 REAL_HSM Online (NitroKey & Utimaco FIPS 140-3 Level 4)
• Seal Storage Matrix:  14,902 Canonical Seals [VERIFIED] + 80 Quarantined [Chamber 02 Buffer Gamma STANDBY]
• Network & Telemetry:  Port 8443 (mTLS 1.3 + Kyber-1024) | Replay Latency: 35.80 ms
• SSoT Drift Invariant: Δ0 = 0.000% Zero Drift`};if(e==="audit verify"||e==="verify audit"||e==="zyrquen audit verify")return{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN CLI → DETERMINISTIC AUDIT VERIFY (16-STAGE FORENSIC MATRIX)]
# ======================================================================
• Stage 01–04 (Ingestion, TSA RFC 3161, SHA3-512, Merkle #849202):   PASSED (100%)
• Stage 05–08 (Dilithium-5, SPHINCS+, 10/10 HSM Quorum, WORM 14,902): PASSED (100%)
• Stage 09–12 (Chamber 02 Buffer Gamma [STANDBY], zk-SNARKs PDPA):    PASSED (100%)
• Stage 13–16 (35.80 ms Replay SLA, ISO/IEC 27037, ETDA Sec 9/26/28): PASSED (100%)
# ======================================================================
• Verified Merkle Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
• Genesis Block Anchor: #849202 | Canonical Seals: 14,902 / 14,902 Verified
• Quarantined Buffer:   Chamber 02 Buffer Gamma [STANDBY] (80 Seals Isolated)
• SSoT Mutation Delta:  Δ0 = 0.000% (Strict Frozen Baseline)
• HSM Quorum Consensus: 10/10 REAL_HSM Unanimous | Telemetry Port: 8443 | Latency: 35.80 ms
• Verdict:              COURT-ADMISSIBLE & 100% SYNCHRONIZED WITH COMMAND CENTER OVERVIEW`};if(e.startsWith("phase11")||e==="inspect"||e==="diagnose"||e==="proposal"||e==="approval"||e==="approve"||e==="patch"||e==="test"||e==="build"||e==="verify"){const t=c.find(r=>e===r.id.toLowerCase()||e.includes(r.id.toLowerCase())||e==="approve"&&r.id==="APPROVAL");if(t)return{recognized:!0,command:a,type:"success",responseText:`[PHASE 11 WORKSPACE ENGINEERING — STAGE ${t.stepNumber}/9: ${t.label.toUpperCase()} (${t.labelTh})]
# ======================================================================
• Command:       ${t.command}
• Status:        ${t.status} (${t.durationMs.toFixed(2)} ms)
• Artifact Hash: ${t.artifactHash}
• Summary:       ${t.summary}
${t.details.map(r=>`  • ${r}`).join(`
`)}`};const o=c.map(r=>`  [${r.stepNumber}/9] ${r.label.padEnd(9," ")} → PASSED (${r.durationMs.toFixed(1)}ms) | ${r.summary}`).join(`
`);return{recognized:!0,command:a,type:"success",responseText:`[PHASE 11 CONNECTED WORKSPACE PIPELINE: Inspect → Diagnose → Proposal → Approval → Patch → Test → Build → Verify → Audit]
# ======================================================================
Connected Target: sovereign-core-engine (Genesis #849202 | Δ0 = 0.000% | Port 8443)
${o}
# ======================================================================
• Total End-to-End Cycle: 35.80 ms | HSM Quorum: 10/10 | SSoT Drift: Δ0 = 0.000%`}}return e==="snapshot"||e==="signed-snapshot"||e==="zyrquen snapshot"||e.includes("zyrquen-signed-snapshot.json")?{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN CLI → SIGNED SNAPSHOT VERIFIER (zyrquen-signed-snapshot.json)]
# ======================================================================
• Snapshot ID:       SNAP-849205-20260927-082622 (TSA-RFC3161-MICROSECOND-VERIFIED)
• Engine & Alias:    ZYRQUEN Ω∞ Sovereign World Engine (Quantaris Multiverse Engine)
• Principal:         นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
• Block Height:      Canonical #849202 | Local #849205 | Consensus Drift: Δ0.00%
• Integrity Score:   99.47% | CI/CD Workflow: 30/30 PASSING (100%)
• Merkle Root Hash:  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (100% SSoT Parity)
• Seal Registry:     14,902 Active Intact / 14,982 Total Pool (80 Quarantined in Chamber 02 Fail-Closed)
• PQC Cryptography:  FIPS 203 (ML-KEM-1024) + FIPS 204 (ML-DSA-87 Dilithium-5) + FIPS 205 (SLH-DSA) + SHA3-512
• Hardware & Cryo:   10/10 REAL_HSM (NitroKey HSM-PQC-01) | Cryostat: 14.98 mK | Latency: 35.56 ms (< 142.00 ms SLA)
• Legal Compliance:  ISO/IEC 27037:2012 | พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (ม.9, 26, 28) | PDPA พ.ศ. 2562 (ม.26, 37)
• Verifier Status:   VALID_AND_SEALED`}:e==="agentic-mesh"||e==="agentic"||e==="mesh"||e.includes("agentic-reasoning-mesh")?{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN CLI → AGENTIC REASONING MESH (agentic-reasoning-mesh-config.json)]
# ======================================================================
• Workspace:         agentic-reasoning-mesh (เครือข่าย AI Agent ประมวลผลตรรกะขั้นสูง)
• Runtime & Backend: Python 3.12 AI Runtime · Sovereign Mesh Backend
• Active Agents:     3 Agents Orchestrated (AGT-01 Logic, AGT-02 Forensic, AGT-03 Sentinel)
• Resources Allocated: 16 CPU Cores | 32 GB ECC RAM | 250 GB WORM Storage
• Real-time Usage:   CPU 68.4% | RAM 78.2% (NEAR_OPTIMAL_LOAD)
• Inference Params:  Context Window 128k (131,072 tokens) | Batch Size 64 | Speed 24,960 QOps/s
• Security Profile:  FIPS 203/204 Enclave Ready (Kyber-1024 + Dilithium-5 + 10/10 REAL_HSM)
• Bound Snapshot:    SNAP-849205-20260927-082622 (Δ0.00% Zero-Drift Verified)`}:e==="chambers"||e==="chamber telemetry"||e==="zyrquen chambers"?{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN CLI → CHAMBER TELEMETRY DEEP ANALYSIS (Snapshot + Agentic Mesh)]
# ======================================================================
  [Chamber 01] PQC Vault              | Load: 95%      | Temp: 36°C   | Status: NORMAL             | Agent: AGT-01-LOGIC
  [Chamber 02] Quarantine Airgap      | Load: 80_seals | Temp: NORMAL | Status: FAIL_CLOSED        | Agent: AGT-03-SENTINEL
  [Chamber 04] HSM Quorum (10/10)     | Load: 21%      | Temp: 81°C   | Status: CRITICAL_MONITORED | Agent: AGT-03-SENTINEL (Cryo 14.98 mK Active)
  [Chamber 05] DAG Consensus Engine   | Load: 98%      | Temp: 38°C   | Status: NORMAL             | Agent: AGT-01-LOGIC (24,960 QOps/s)
  [Chamber 06] Sovereign Circuit Brk  | Load: 99%      | Temp: 42°C   | Status: NORMAL             | Agent: AGT-03-SENTINEL (<85°C Guard)
  [Chamber 11] Court Dossier Annex    | Load: 64%      | Temp: 58°C   | Status: WARNING            | Agent: AGT-02-FORENSIC (Batching 64-Window)
# ======================================================================
• Cryostat Bus: 14.98 mK (Helium-4 74.2%) | 768 Qubits Coherence: 99.98–99.992% | Drift: Δ0.00%`}:e==="assurance"||e==="resilience"||e==="resilience-layers"||e==="zyrquen assurance"?{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN CLI → QUANTARIS RESILIENCE ASSURANCE LAYER BLUEPRINT (5-LAYER ARCHITECTURE)]
# ======================================================================
• Layer-1 (Cryptographic Sovereign Core):
  - Kyber-1024 Key Exchange (FIPS 203) → ป้องกัน Harvest-Now Decrypt-Later
  - Dilithium-5 Signature (FIPS 204)   → ลงลายมือชื่ออธิปไตย 14,902 Active Seals
  - SLH-DSA Stateless Hash (FIPS 205)  → ตรวจสอบความสมบูรณ์ระดับบิต (SHA3-512)
• Layer-2 (Quorum & Isolation):
  - Deca-Key Quorum (10/10 REAL_HSM)   → ขจัด Single Point of Failure (NitroKey FIPS 140-3 L4)
  - Chamber 02 Quarantine              → Fail-Closed Isolation (80 Seals Contained)
  - Circuit Breaker Protocol           → Trigger ที่ 85.0°C (Ch04 @ 81°C, Proactive Phoenix Healing)
• Layer-3 (Phoenix Healing Runtime):
  - 5-Phase Cycle: Sense → Ingest → Assure → Understand → Simulate/Decide
  - Execution Latency: 35.56 ms (SLA Ceiling 142.00 ms, Safety Margin +106.44 ms)
  - Chaos Distortion Visualizer: Hologram Glitch → Auto-Heal → Cosmic Bloom
• Layer-4 (Legal & Compliance Assurance):
  - ETDA Sec 9/26/28  → ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ (พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์)
  - PDPA Sec 26/37    → Zero-Trust + PQC + PDPA FINAL (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล)
  - ISO/IEC 27037:2012 → Chain of Custody Forensic Audit Trajectory
• Layer-5 (Visualization & Monitoring):
  - Phoenix Dashboard G16              → Real-time Resilience Metrics (Score 99.6/100, 1600Hz)
  - Gold Seal Verification Console     → Sovereign Trust Indicators (99.47% Integrity, Δ0.00%)
  - Quantum Radar Pulse                → PlaneGeometry + GPU BufferAttribute (aTelemetryIntensity, aZoneVector) Heatmap`}:e==="phoenix-rec"||e==="chaos-sim"||e==="auto-heal"||e==="arch-index"?{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN CLI → QUANTARIS-PHOENIX-REC-v∞.2 & ARCHITECTURAL PHASE INDEX]
# ======================================================================
• Spec ID: QUANTARIS-PHOENIX-REC-v∞.2 (Phase-2 Phoenix Recovery Pipeline)
  1. PHOENIX-CHAOS-SIM     → Chaos-Resilience Simulation Engine (Isolation < 5 ms, Bitwise Deterministic)
  2. PHOENIX-TELEMETRY-G16 → Telemetry Dashboard G16 Sampling @ 1600Hz (24,960 QOps/s, GPU BufferAttribute)
  3. PHOENIX-AUTO-HEAL     → Auto-Healing Runtime Blocks (Hot-Swap Microkernel < 85 ms, Actual: 35.56 ms)
• Execution Flow:
  Detect Anomaly (Radar Pulse) → Ingest Telemetry (G16 1600Hz) → Isolate Risk (Router Shield <5ms)
  → Auto-Heal (Hot-Swap Blocks 35.56ms) → Confirm & Verify (Gold Seal + Deca-Key 10/10 HSM)
• Architectural Phase Specification Index:
  - Phase-A (QUANTARIS-HOLO-THEME-v∞.A)      : THEME-PALETTE-FQ, THEME-CONSOLE-BLOCKS, THEME-TAILWIND-COSMIC
  - Phase-B (QUANTARIS-HOLO-GRID-v∞.B)       : GRID-NAV-3D, GRID-RADAR-PULSE, GRID-NEON-MESH (GPU BufferAttribute)
  - Phase-C (QUANTARIS-HOLO-TELEMETRY-v∞.C)  : TEL-PHOENIX-DASH, TEL-GOLD-SEAL, TEL-AI-BENCHMARK (4 Byzantine Agents)
  - Phase-D (QUANTARIS-HOLO-EFFECTS-v∞.D)    : FX-PARTICLE-STREAM (5,000 pts), FX-CHAOS-DISTORT, SEC-IDENTITY-GATE
  - Phase-1..4 Core & CyberDefense           : MEC-v∞.1 (>840 Gbps), PHOENIX-REC-v∞.2, SOV-VERIF-v∞.3, CYBERDEFENSE-v∞.4`}:e==="boundary"||e==="adapter"||e==="write-gate"||e==="zyrquen boundary"?{recognized:!0,command:a,type:"success",responseText:`[ZYRQUEN ADAPTER / INTEGRATION BOUNDARY — SOVEREIGN SEPARATION OF CONCERNS]
# ======================================================================
• ZYRQUEN Ω∞ (ระบบหลัก 🔒)      : คงเดิม / ไม่รื้อ / ไม่ปรับ Core (Immutable Frozen Kernel v1.2 LTS)
• Cloud & AI Command (เครื่องมือ 🛠️) : พัฒนาต่อเพื่อเป็นเครื่องมือช่วยจัดการและปรับระบบผ่าน Adapter Boundary
# ======================================================================
Command Center
      │
      ▼
ZYRQUEN Adapter / Integration Boundary
      ├── READ  → status / workspace / resources / audit  (Direct Read-Only Pass-Through, 0 Mutation)
      └── WRITE → approval → command → audit              (Enforced 6-Gate Pipeline)
# ======================================================================
• Mandatory 6-Gate Write Execution Pipeline:
  [1] Inspect → [2] Preview → [3] Explicit Approval → [4] Execute → [5] Verify → [6] Audit
• Phase 11 Core Guard:
  LOCKED (ไม่อนุญาตให้ Phase 11 แก้ไข ZYRQUEN Core โดยตรง เว้นแต่ได้รับคำสั่ง Integration/Change ที่อนุมัติชัดเจน)`}:{recognized:!1,command:a,type:"output",responseText:""}}const v=[{id:"INSPECT",stepNumber:1,label:"Inspect",labelTh:"ตรวจสอบสถานะและขอบเขตเป้าหมาย",status:"PASSED",latencyMs:2.4,description:"Read-only inspection of target workspace, active seals (14,902), and Core lock status."},{id:"PREVIEW",stepNumber:2,label:"Preview",labelTh:"จำลองผลลัพธ์และแสดง Diff ก่อนรันจริง",status:"PASSED",latencyMs:3.1,description:"Generates non-mutating dry-run diff across ZYRQUEN Adapter Boundary (0 Core changes)."},{id:"EXPLICIT_APPROVAL",stepNumber:3,label:"Explicit Approval",labelTh:"อนุมัติอย่างชัดแจ้งแล้ว (#EP-SOVEREIGN-01)",status:"PASSED",latencyMs:4.8,description:"Mandatory human-in-the-loop cryptographic sign-off completed and locked."},{id:"EXECUTE",stepNumber:4,label:"Execute",labelTh:"รันคำสั่งผ่าน ZYRQUEN Adapter",status:"PASSED",latencyMs:11.8,description:"Executed approved command strictly within Adapter / Integration Layer (ZYRQUEN Core untouched)."},{id:"VERIFY",stepNumber:5,label:"Verify",labelTh:"ทวนสอบ Merkle Root & Zero Drift Δ0.00%",status:"PASSED",latencyMs:4.2,description:"Verified SSoT Merkle parity (64/64 hex), Δ0.00% drift, and 35.56 ms SLA compliance."},{id:"AUDIT",stepNumber:6,label:"Audit",labelTh:"บันทึกหลักฐานลง WORM Audit Ledger",status:"PASSED",latencyMs:1.9,description:"Appended immutable RFC 3161 & Dilithium-5 signed entry to Gateway Audit Log (FINALIZED 🔒)."}],I=[{id:"cmd-adapter-telemetry-tune",title:"Tune Adapter Telemetry Buffer Window (Overlay Only)",targetWorkspace:"telemetry-core-8443",touchesCoreDirectly:!1,commandString:"zyrquen-adapter write --workspace telemetry-core-8443 --set-window 64 --preserve-core",inspectSummary:"Target: telemetry-core-8443 (Adapter Ring-3) | ZYRQUEN Ω∞ Core: LOCKED 🔒 (Untouched) | Drift: Δ0.00%",previewDiff:["- adapter.telemetry.batch_window_size = 32","+ adapter.telemetry.batch_window_size = 64","  zyrquen.core.kernel_state           = IMMUTABLE_LOCKED (No Change)"],verifySummary:"Verified: Merkle e3b0c442...852b855 intact | Δ0 = 0.000% | Latency 35.56 ms | 14,902 Active Seals",auditReceipt:"AUDIT-ADAPTER-849205-W01 · Signed by #EP-SOVEREIGN-01 (10/10 REAL_HSM)"},{id:"cmd-adapter-agent-mesh-rebalance",title:"Rebalance Agentic Reasoning Mesh Context Allocation",targetWorkspace:"agentic-reasoning-mesh",touchesCoreDirectly:!1,commandString:"zyrquen-adapter write --workspace agentic-reasoning-mesh --rebalance-agents AGT-01,AGT-02,AGT-03",inspectSummary:"Target: agentic-reasoning-mesh (Python 3.12 Runtime) | ZYRQUEN Ω∞ Core: LOCKED 🔒 (Untouched)",previewDiff:["- mesh.agent_03_sentinel.thermal_poll_ms = 1000","+ mesh.agent_03_sentinel.thermal_poll_ms = 500 (Chamber 04 81°C Watch)","  zyrquen.core.kernel_state              = IMMUTABLE_LOCKED (No Change)"],verifySummary:"Verified: 3 Agents Active | CPU 68.4% / RAM 78.2% | Zero Core Mutation | Δ0 = 0.000%",auditReceipt:"AUDIT-ADAPTER-849205-W02 · Signed by #EP-SOVEREIGN-01 (10/10 REAL_HSM)"},{id:"cmd-direct-core-mutation-test",title:"[Guard Test] Attempt Direct ZYRQUEN Core Kernel Modification (Phase 11)",targetWorkspace:"sovereign-core-engine",touchesCoreDirectly:!0,commandString:"zyrquen-core mutate --kernel-ring0 --override-genesis 849202",inspectSummary:"⚠️ ALERT: Command targets ZYRQUEN Ω∞ Core directly! Phase 11 Direct Core Write Lock is ACTIVE 🔒.",previewDiff:["! BLOCKED BY ADAPTER BOUNDARY: ZYRQUEN ตัวจริง = คงเดิม / ไม่รื้อ / ไม่ปรับ Core","! Phase 11 has NO direct write permission to ZYRQUEN Core unless Explicit Integration Override is authorized."],verifySummary:" Verified only when Explicit Integration/Change Directive is unlocked by Sovereign Principal (#EP-SOVEREIGN-01).",auditReceipt:"AUDIT-BOUNDARY-GUARD-849205 · Core Protection Enforced"}];export{I as A,S as C,g as I,p as a,y as b,C as c,A as d,T as e,v as f,f as v};
