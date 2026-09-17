const fs = require('fs');
let code = fs.readFileSync('src/components/views/SettingsView.tsx', 'utf-8');

code = code.replace(
  `                {soundFeedback ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>`,
  `                {soundFeedback ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div>
                <div className="font-bold text-zinc-200">Ambient Harmonic Carrier Profile</div>
                <div className="text-[11px] text-zinc-500">Select the background soundscape for the control plane</div>
              </div>
              <select
                value={activeProfile}
                onChange={(e) => {
                  const newProfile = e.target.value as AudioProfileId;
                  setActiveProfile(newProfile);
                  setAmbientSoundProfile(newProfile, true);
                  playAuditChime();
                }}
                className="px-3 py-1.5 rounded-xl border bg-black/50 text-cyan-300 border-white/10 font-bold text-xs outline-none focus:border-cyan-500/50"
              >
                {AUDIO_PROFILES.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>`
);

fs.writeFileSync('src/components/views/SettingsView.tsx', code);
