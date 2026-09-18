import re

with open('src/components/views/SecurityView.tsx', 'r') as f:
    content = f.read()

tab_button = """        <button
          onClick={() => {
            setActiveTab('level3-threat-injection');
          }}
          className={`relative z-10 px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold tracking-wide ${
            activeTab === 'level3-threat-injection'
              ? 'bg-rose-500/25 text-rose-100 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${activeTab === 'level3-threat-injection' ? 'text-rose-400' : 'text-zinc-500'}`} />
          <span>Threat Injection Lab</span>
        </button>"""

# insert button before the </nav> that closes the tablist
nav_end_idx = content.find('</nav>')
if nav_end_idx != -1:
    content = content[:nav_end_idx] + tab_button + "\n      " + content[nav_end_idx:]

# insert the content block
content_block = """      {activeTab === 'level3-threat-injection' && (
        <div className="space-y-6">
          <SecurityGateLevel3Simulator />
        </div>
      )}\n"""

# insert before evidence-truth
truth_idx = content.find("{activeTab === 'evidence-truth' &&")
if truth_idx != -1:
    content = content[:truth_idx] + content_block + content[truth_idx:]

with open('src/components/views/SecurityView.tsx', 'w') as f:
    f.write(content)
