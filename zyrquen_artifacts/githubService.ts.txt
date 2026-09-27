export interface GitHubCommitInfo {
  commitHash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  commitUrl: string;
  status: 'LIVE' | 'CACHED_FALLBACK';
}

const REPO_PATH = 'hugeplease66-debug/zyrquen-frozen-v1.2-lts';
const REPO_URL = `https://github.com/${REPO_PATH}`;
const GITHUB_API_ENDPOINT = `https://api.github.com/repos/${REPO_PATH}/commits?per_page=1`;

let cachedCommit: { data: GitHubCommitInfo; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export const fetchLatestCommit = async (): Promise<GitHubCommitInfo> => {
  const now = Date.now();
  if (cachedCommit && now - cachedCommit.timestamp < CACHE_TTL_MS) {
    return cachedCommit.data;
  }

  try {
    const response = await fetch(GITHUB_API_ENDPOINT, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}`);
    const commits = await response.json();
    
    if (!commits || commits.length === 0) throw new Error('No commits returned');

    const latest = commits[0];
    const info: GitHubCommitInfo = {
      commitHash: latest.sha,
      shortHash: latest.sha.substring(0, 7),
      author: latest.commit.author.name,
      date: latest.commit.author.date,
      message: latest.commit.message.split('\n')[0],
      commitUrl: latest.html_url,
      status: 'LIVE',
    };

    cachedCommit = { data: info, timestamp: now };
    return info;
  } catch (error) {
    console.warn('GitHub API fetch fallback engaged:', error);
    return {
      commitHash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      shortHash: '909ab81',
      author: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      date: '2026-09-16T19:00:00+07:00',
      message: 'LOCKED_FROZEN_v1.2_LTS Canonical Baseline',
      commitUrl: REPO_URL,
      status: 'CACHED_FALLBACK',
    };
  }
};
