import metadata from '../../metadata.json';

// Centralized dynamic application metadata & version injection (SSoT)
export const APP_METADATA = {
  name: metadata.name,
  description: metadata.description,
  version: 'v1.2.1 LTS',
  releaseTag: 'FROZEN v1.2.1 LTS',
  ltsLabel: 'v1.2.1-LTS',
  genesisBlock: 849202,
  merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
};

export const getAppVersion = (): string => APP_METADATA.version;
export const getAppReleaseLabel = (): string => APP_METADATA.releaseTag;
