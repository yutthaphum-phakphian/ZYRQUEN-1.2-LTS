import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AtlasSpatialMathEngine,
} from '../../src/workers/sovereignAtlasSpatialWorker';
import {
  SovereignAtlasWorkerService,
  sovereignAtlasWorker,
} from '../../src/services/SovereignAtlasWorkerService';

test('Sovereign Atlas 3D Hologram Grid Web Worker & Spatial Math Engine', async (t) => {
  await t.test('calculates 3D gravitational well vector fields with zero-drift accuracy', async () => {
    const rect = { left: 0, top: 0, width: 640, height: 320 };
    // Test center coordinates
    const centerResult = AtlasSpatialMathEngine.calculateGravityField(320, 160, rect, 6.5, 1.65);

    assert.equal(centerResult.normX, 50);
    assert.equal(centerResult.normY, 50);
    assert.equal(centerResult.gx, 0);
    assert.equal(centerResult.gz, 0);
    assert.equal(centerResult.dx, 0);
    assert.ok(centerResult.fieldTesla >= 1.42);
    assert.ok(centerResult.targetGravity.strength > 0);

    // Test corner coordinates
    const cornerResult = AtlasSpatialMathEngine.calculateGravityField(640, 320, rect, 6.5, 1.65);
    assert.equal(cornerResult.normX, 100);
    assert.equal(cornerResult.normY, 100);
    assert.equal(cornerResult.gx, 6.5);
    assert.equal(cornerResult.gz, 6.5);
    assert.ok(cornerResult.magnitude >= 0);
  });

  await t.test('calculates harmonic chamber node orbital positions and rotations', async () => {
    const nodes = [
      { id: 'ch-00', basePos: [0, 0, 0] as [number, number, number] },
      { id: 'ch-01', basePos: [2.6, 0.4, 1.2] as [number, number, number] },
      { id: 'ch-02', basePos: [1.8, 1.9, -1.5] as [number, number, number] },
    ];

    const result = AtlasSpatialMathEngine.calculateChamberOrbitals(1.5, 1.0, nodes);

    assert.equal(result.nodes.length, 3);
    assert.equal(result.nodes[0].id, 'ch-00');
    assert.equal(result.nodes[0].position[0], 0);
    assert.equal(result.nodes[0].position[2], 0);
    assert.ok(typeof result.nodes[0].position[1] === 'number');
    assert.ok(result.nodes[0].haloScale > 0.8 && result.nodes[0].haloScale < 1.2);
    assert.equal(result.coreRotation.xDelta > 0, true);
    assert.equal(result.coreRotation.yDelta > 0, true);
  });

  await t.test('generates spatial heatmap hotspot matrix with bounded intensities', async () => {
    const dimensions = [
      { id: 'dim-00', coordinates: [0, 0, 0] as [number, number, number], qOps: 950 },
      { id: 'dim-01', coordinates: [3, 1, 2] as [number, number, number], qOps: 1200 },
    ];

    const heatmap = AtlasSpatialMathEngine.calculateSpatialHeatmap(dimensions, 6);

    assert.equal(heatmap.hotspots.length, 2);
    assert.equal(heatmap.hotspots[0].x, 0);
    assert.equal(heatmap.hotspots[0].z, 0);
    assert.ok(heatmap.hotspots[0].intensity <= 1.0);
    assert.ok(heatmap.hotspots[0].radius >= 1.8);
    assert.equal(heatmap.hotspots[1].intensity, 1.0); // clamped to 1.0
  });

  await t.test('SovereignAtlasWorkerService operates as singleton with robust fallback', async () => {
    const instance1 = SovereignAtlasWorkerService.getInstance();
    const instance2 = sovereignAtlasWorker;

    assert.strictEqual(instance1, instance2);

    const rect = { left: 10, top: 20, width: 400, height: 300 };
    const asyncResult = await instance1.calculateGravityField(210, 170, rect);

    assert.ok(asyncResult);
    assert.equal(typeof asyncResult.gx, 'number');
    assert.equal(typeof asyncResult.gz, 'number');
    assert.equal(typeof asyncResult.fieldTesla, 'number');
  });

  await t.test('transforms spatial coordinates and camera damping off-thread', async () => {
    const dimensions = [
      { id: 'dim-00', coordinates: [0, 0, 0] as [number, number, number], qOps: 850, accentHex: '#06B6D4' },
      { id: 'dim-01', coordinates: [2, 1, -1] as [number, number, number], qOps: 920, accentHex: '#A855F7' },
    ];

    const result = AtlasSpatialMathEngine.transformCoordinates(dimensions, 1.0, { x: 0.5, y: -0.2 });

    assert.equal(result.transformedNodes.length, 2);
    assert.equal(result.transformedNodes[0].id, 'dim-00');
    assert.equal(result.transformedNodes[0].projectedCoords[0], 0.5);
    assert.equal(result.transformedNodes[0].projectedCoords[1], -0.2);
    assert.equal(result.totalQOps, 1770);
    assert.ok(result.cameraDamping.dist > 0);
  });

  await t.test('processes real-time telemetry stream and detects significant shifts', async () => {
    const telemetry = [
      { time: '00s', entropy: 0.02, qops: 850, coherence: 99.98 },
      { time: '02s', entropy: 0.03, qops: 851, coherence: 99.97 },
      { time: '04s', entropy: 0.08, qops: 853, coherence: 99.99 },
    ];

    const processed = AtlasSpatialMathEngine.processTelemetry(telemetry, 0.03);

    assert.equal(processed.smoothedTelemetry.length, 3);
    assert.equal(processed.coherenceSlaPassed, true);
    assert.ok(processed.meanEntropy > 0);
    assert.equal(processed.hasSignificantShift, true);
  });
});
