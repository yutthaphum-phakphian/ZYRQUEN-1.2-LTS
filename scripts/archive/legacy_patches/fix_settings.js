const fs = require('fs');
let code = fs.readFileSync('src/components/views/SettingsView.tsx', 'utf-8');

// Fix duplicate imports
code = code.replace(
  /  setAmbientSoundProfile,\n  AUDIO_PROFILES,\n  getActiveProfileId,\n  type AudioProfileId,\n/g,
  ""
);

// Fix duplicate state
code = code.replace(
  /  const \[activeProfile, setActiveProfile\] = useState<AudioProfileId>\(getActiveProfileId\(\) as AudioProfileId\);\n  const \[activeProfile, setActiveProfile\] = useState<AudioProfileId>\(getActiveProfileId\(\) as AudioProfileId\);\n/g,
  "  const [activeProfile, setActiveProfile] = useState<AudioProfileId>(getActiveProfileId() as AudioProfileId);\n"
);

fs.writeFileSync('src/components/views/SettingsView.tsx', code);
