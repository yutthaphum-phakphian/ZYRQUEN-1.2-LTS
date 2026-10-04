import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { saveWorkspace, loadWorkspace, saveDurableRecord, loadDurableRecord, deleteDurableRecord } from '../server/durableStore.ts';

async function main() {
  const root = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
  const projectId = `v20-test-${Date.now()}`;
  const workspace = await saveWorkspace({ projectId, version: 1, updatedAt: new Date().toISOString(), files: [{ name: 'src/App.tsx', content: 'export const App = () => null;', language: 'tsx' }], metadata: { stage: 'V20' }, integrityHash: '' });
  assert.equal(workspace.version, 2);
  const restored = await loadWorkspace(projectId);
  assert.equal(restored?.files[0]?.name, 'src/App.tsx');

  const mission = await saveDurableRecord('mission', projectId, { status: 'PAUSED', currentTaskId: 'task-1' });
  const missionRestored = await loadDurableRecord<typeof mission.payload>('mission', projectId);
  assert.equal(missionRestored?.payload.status, 'PAUSED');

  await fs.writeFile(path.join(root, 'mission', `${projectId}.json`), JSON.stringify({ ...mission, integrityHash: 'tampered' }), 'utf8');
  await assert.rejects(() => loadDurableRecord('mission', projectId), /RECORD_INTEGRITY_FAILED/);
  await deleteDurableRecord('mission', projectId);
  console.log('V20 DURABLE RUNTIME TESTS: PASS');
}
main().catch((error) => { console.error(error); process.exit(1); });
