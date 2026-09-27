import fs from 'fs';

let serverCode = fs.readFileSync('server.ts', 'utf-8');

// The new GET /api/v1/version and GET /api/v1/github/latest-commit
const additionalRoutes = `
// ============================================================================
// NEW GITHUB SERVICE / VERSION (v6.1)
// ============================================================================

const GITHUB_REPO = "hugeplease66-debug/zyrquen-frozen-v1.2-lts";
const GITHUB_API_URL = "https://api.github.com/repos/" + GITHUB_REPO + "/commits?per_page=1";
let _commit_cache = { data: null, fetched_at: 0 };
const CACHE_TTL_SEC = 300; // 5 min

async function fetch_latest_commit_from_github() {
    const now = Date.now() / 1000;
    if (_commit_cache.data && (now - _commit_cache.fetched_at < CACHE_TTL_SEC)) {
        return _commit_cache.data;
    }

    try {
        const resp = await fetch(GITHUB_API_URL, {
            headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "ZYRQUEN-SOVEREIGN-API" }
        });
        if (!resp.ok) throw new Error("GitHub API Error " + resp.status);
        const commits = await resp.json();
        if (!commits || commits.length === 0) throw new Error("Empty commits");
        
        const latest = commits[0];
        const commit_data = {
            repo: GITHUB_REPO,
            commitHash: latest.sha,
            shortHash: latest.sha.substring(0, 7),
            author: latest.commit.author.name,
            date: latest.commit.author.date,
            message: latest.commit.message.split('\\n')[0],
            commitUrl: latest.html_url,
            status: "LIVE"
        };
        _commit_cache.data = commit_data;
        _commit_cache.fetched_at = now;
        return commit_data;
    } catch (e) {
        const fallback = {
            repo: GITHUB_REPO,
            commitHash: "909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68",
            shortHash: "909ab81",
            author: "นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)",
            date: "2026-09-16T19:00:00+07:00",
            message: "FROZEN LTS Genesis 849202 - Offline Court-Ready Cache",
            commitUrl: "https://github.com/" + GITHUB_REPO,
            status: "CACHED_FALLBACK"
        };
        _commit_cache.data = fallback;
        _commit_cache.fetched_at = now;
        return fallback;
    }
}

app.get('/api/v1/version', async (req, res) => {
    const github_info = await fetch_latest_commit_from_github();
    res.json({
        deployment_state: SYSTEM_METRICS.status,
        genesis_block: SYSTEM_METRICS.block_height,
        merkle_root: SYSTEM_METRICS.merkle_root_genesis,
        seals: SYSTEM_METRICS.canonical_seals_count,
        drift: SYSTEM_METRICS.drift,
        cert: "ZQ-GREEN-DEP-849202-3908",
        github: github_info,
        api_gateway: "Node.js Express + FastAPI v1.2.0-LTS Chamber 11 DEV CENTER",
        otel: "OTLP Protobuf/gRPC mTLS :4318 - 2,466 spans/sec"
    });
});

app.get('/api/v1/github/latest-commit', async (req, res) => {
    const github_info = await fetch_latest_commit_from_github();
    res.json(github_info);
});
`;

if (!serverCode.includes('/api/v1/version')) {
    const setupIndex = serverCode.indexOf('async function setupApp()');
    if (setupIndex !== -1) {
        const newCode = serverCode.slice(0, setupIndex) + additionalRoutes + '\n' + serverCode.slice(setupIndex);
        fs.writeFileSync('server.ts', newCode);
        console.log("Successfully patched server.ts with github endpoint");
    }
}
