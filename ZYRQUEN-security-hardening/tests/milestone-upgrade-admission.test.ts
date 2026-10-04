import { admitUpgrade, createUpgradeCheck } from '../server/upgradeAdmission.ts';

const pass = admitUpgrade([
  createUpgradeCheck('baseline-regression', true, 'all targeted regression checks passed'),
  createUpgradeCheck('workspace-integrity', true, 'workspace state is clean'),
]);
if (pass.status !== 'ADMITTED' || pass.blockers.length !== 0 || pass.auditHash.length !== 64) {
  throw new Error('upgrade admission should be ADMITTED');
}

const blocked = admitUpgrade([
  createUpgradeCheck('baseline-regression', true, 'passed'),
  createUpgradeCheck('dependency-health', false, 'runtime dependency installation unavailable'),
]);
if (blocked.status !== 'BLOCKED' || blocked.blockers[0] !== 'dependency-health') {
  throw new Error('upgrade admission should block on failed prerequisite');
}

console.log('Upgrade admission milestone: PASS');
