const fs = require('fs');
let code = fs.readFileSync('src/components/views/SettingsView.tsx', 'utf-8');

if (!code.includes("import { AudioWaveform }")) {
  code = `import { AudioWaveform } from '../AudioWaveform';\n` + code;
}

code = code.replace(
  `              </select>
            </div>
          </div>
        </div>`,
  `              </select>
            </div>
            
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-xs">Real-Time Waveform</span>
                <span className="text-[10px] text-cyan-400 animate-pulse">LIVE</span>
              </div>
              <AudioWaveform />
            </div>
          </div>
        </div>`
);

fs.writeFileSync('src/components/views/SettingsView.tsx', code);
