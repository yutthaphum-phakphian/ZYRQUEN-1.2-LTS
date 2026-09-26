import { SOVEREIGN_CONFIG } from './sovereign.config';

const EXPECTED_GENESIS = "909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68";
const EXPECTED_SEALS = 14902;

export function validateBuildTimeInvariants(): boolean {
  const errors: string[] = [];

  if (SOVEREIGN_CONFIG.genesisAnchor.merkleRoot !== EXPECTED_GENESIS) {
    errors.push(`Genesis Merkle Root mismatch (SSoT Δ0 VIOLATED)`);
  }
  if (SOVEREIGN_CONFIG.sealsRegistry.canonicalSealsCount !== EXPECTED_SEALS) {
    errors.push(`Canonical seals count mismatch`);
  }
  if (SOVEREIGN_CONFIG.sealsRegistry.baselineDriftPct !== 0.0) {
    errors.push(`Baseline drift is non-zero (SSoT Δ0 VIOLATED)`);
  }

  if (errors.length > 0) {
    throw new Error(`SOVEREIGN CONFIG VALIDATION FAILED:\n${errors.join('\n')}`);
  }
  
  return true;
}
