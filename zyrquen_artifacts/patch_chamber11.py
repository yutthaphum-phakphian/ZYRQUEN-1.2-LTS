import re

with open('src/components/Chamber11QuantumRadar.tsx', 'r') as f:
    content = f.read()

# 1. Add baseline drift state and glitching effect.
state_add = """  const [baselineDrift, setBaselineDrift] = useState<number>(0);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
"""
content = content.replace("  const [logs, setLogs] = useState<string[]>([", state_add + "  const [logs, setLogs] = useState<string[]>([")

# Update handleTriggerThreatSimulator to also trigger drift
threat_sim = """    setBaselineDrift(0.12);
    setIsGlitching(true);
    setTimeout(() => {
      setIsGlitching(false);
      setBaselineDrift(0);
    }, 2500);"""
content = content.replace("playTone(880, 0.08, 'sine');\n    }, 200);", "playTone(880, 0.08, 'sine');\n    }, 200);\n\n" + threat_sim)

# Add grid pattern overlay to canvas
# find: // Radial gradient glow from center
grid_code = """    // Animated Grid Pattern Overlay for 8K Radar Fidelity
    const timeSec = Date.now() / 1000;
    const gridOffset = (timeSec * 15) % 20;
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x = gridOffset; x < width; x += 20) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for(let y = gridOffset; y < height; y += 20) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Radial gradient glow from center"""
content = content.replace("// Radial gradient glow from center", grid_code)

# Add glitch class to canvas container
glitch_class = "className={`relative cursor-crosshair transition-all duration-75 ${isGlitching ? 'translate-x-1 -translate-y-1 skew-x-2 brightness-150 contrast-125 sepia-[0.3] hue-rotate-[320deg]' : ''}`}"
content = content.replace("className=\"relative cursor-crosshair\"", glitch_class)

# Add export button overlay on the canvas container
export_btn = """          {/* Export Waveform Telemetry Button */}
          <button
            onClick={() => {
              playAuditChime();
              const telemetryBlob = new Blob([JSON.stringify({
                 artifact: "MerkleWave_Telemetry",
                 timestamp: new Date().toISOString(),
                 baseline_drift: baselineDrift,
                 signature: "SHA3-512-R-FIPS",
                 data: threats
              }, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(telemetryBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `merklewave-telemetry-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="absolute bottom-4 right-4 z-10 px-3 py-1.5 bg-black/80 hover:bg-emerald-950/80 border border-emerald-500/50 rounded-lg flex items-center gap-2 text-[10px] font-mono text-emerald-400 shadow-lg backdrop-blur-md transition-all"
          >
            <Download className="w-3 h-3" />
            <span>Export Waveform Telemetry</span>
          </button>"""

content = content.replace("</canvas>\n          </div>", "</canvas>\n" + export_btn + "\n          </div>")

with open('src/components/Chamber11QuantumRadar.tsx', 'w') as f:
    f.write(content)
