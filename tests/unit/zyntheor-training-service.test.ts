import test from 'node:test';
import assert from 'node:assert/strict';
import { zyntheorTrainingService } from '../../src/services/zyntheorTrainingService';

test('ZYNTHEOR CORE Online Training & Self-Model Upgrade Suite', async (t) => {
  await t.test('1. Verifies dataset manifest token statistics and deduplication gate', () => {
    const manifest = zyntheorTrainingService.getDatasetManifest();
    assert.ok(manifest.totalSamples >= 4);
    assert.ok(manifest.thaiSamplesCount >= 2);
    assert.ok(manifest.codeSamplesCount >= 1);
    assert.ok(manifest.englishSamplesCount >= 1);
    assert.ok(manifest.totalTokens > 0);
    assert.equal(manifest.dedupRatio, 1.0);
    assert.equal(manifest.contaminationRate, 0.0);
    assert.equal(manifest.validationStatus, 'RATIFIED');

    // Test deduplication rejection
    const dupRes = zyntheorTrainingService.addDatasetItem({
      instruction: 'จงอธิบายข้อกำหนดตามมาตรา 26 แห่งพระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 สำหรับการสร้างลายมือชื่ออิเล็กทรอนิกส์ที่น่าเชื่อถือ',
      output: 'Duplicate test',
      language: 'th',
      category: 'ETDA_COMPLIANCE',
      tokenCount: 50,
    });
    assert.equal(dupRes.ok, false);
    assert.match(dupRes.error || '', /Duplicate instruction detected/);
  });

  await t.test('2. Ingests new verified Thai-reasoning training sample and logs audit event', () => {
    const initialCount = zyntheorTrainingService.getDatasetItems().length;

    const res = zyntheorTrainingService.addDatasetItem({
      instruction: 'อธิบายหลักการ Zero-Egress Sandbox ในการควบคุมการเข้าถึง window.parent',
      output: 'ระบบตรวจสอบ AST จะทำการ zeroize หรือบล็อกการอ้างอิงถึง window.parent, top.location ทันที เพื่อป้องกันข้อมูลรั่วไหลข้าม iframe',
      language: 'th',
      category: 'CODING_AST',
      tokenCount: 75,
    });

    assert.equal(res.ok, true);
    assert.ok(res.item?.id.startsWith('DS-TH-'));
    assert.equal(zyntheorTrainingService.getDatasetItems().length, initialCount + 1);
  });

  await t.test('3. Manages QLoRA hyperparameters with Qwen2.5-Coder-7B base model baseline', () => {
    const hp = zyntheorTrainingService.getHyperparameters();
    assert.equal(hp.baseModel, 'Qwen/Qwen2.5-Coder-7B-Instruct');
    assert.equal(hp.loraRank, 16);
    assert.equal(hp.quantization, '4BIT_QLORA');

    // Update learning rate
    zyntheorTrainingService.updateHyperparameters({ learningRate: 0.0003 });
    assert.equal(zyntheorTrainingService.getHyperparameters().learningRate, 0.0003);
    zyntheorTrainingService.updateHyperparameters({ learningRate: 0.0002 }); // restore
  });

  await t.test('4. Creates permanent checkpoint with step, loss metrics, and checksum', () => {
    const initialCheckpoints = zyntheorTrainingService.getCheckpoints().length;

    const cp = zyntheorTrainingService.createNewCheckpoint({
      step: 600,
      trainLoss: 1.054,
      evalLoss: 1.082,
      perplexity: 2.95,
      note: 'Epoch 4 completion on Cloud GPU cluster',
    });

    assert.equal(cp.step, 600);
    assert.equal(cp.status, 'SAVED_PERMANENT');
    assert.ok(cp.adapterWeightUri.includes('safetensors'));
    assert.ok(cp.sha256Checksum.length > 20);
    assert.equal(zyntheorTrainingService.getCheckpoints().length, initialCheckpoints + 1);
  });

  await t.test('5. Evaluates checkpoint against benchmark suite and computes measurable improvement delta', () => {
    const evalResult = zyntheorTrainingService.evaluateCheckpointFast('CHK-ZYR-STEP-600');

    assert.ok(evalResult.overallScore > evalResult.baselineScore);
    assert.ok(evalResult.deltaScore > 0);
    assert.equal(evalResult.hasRegression, false);
    assert.equal(evalResult.verdict, 'APPROVED_FOR_STAGING');
    assert.ok(evalResult.thaiReasoningScore > 80);
    assert.ok(evalResult.codingAstScore > 80);
  });

  await t.test('6. Enforces manual sovereign approval gate for promoting weights to production', () => {
    const res = zyntheorTrainingService.promoteCheckpointToProduction(
      'CHK-ZYR-STEP-600',
      '#EP-SOVEREIGN-01'
    );

    assert.equal(res.ok, true);
    assert.match(res.message, /Successfully upgraded ZYNTHEOR CORE/);

    const prod = zyntheorTrainingService.getProductionModel();
    assert.equal(prod.activeAdapterId, 'CHK-ZYR-STEP-600');
    assert.equal(prod.requiresManualApproval, true);
    assert.equal(prod.architectureLevel, 'MODEL_ADAPTER');
  });
});
