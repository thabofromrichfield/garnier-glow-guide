import assert from 'node:assert/strict';
import test from 'node:test';
import { createScanRecord, validateRoutineDraft } from '../account-data.js';

test('scan history stores only the successful event, never biometric data', () => {
  const record = createScanRecord();
  assert.deepEqual(record, { outcome: 'face_in_frame' });
  assert.equal('image' in record, false);
  assert.equal('landmarks' in record, false);
});

test('community routine drafts are validated and submitted for moderation', () => {
  assert.deepEqual(validateRoutineDraft({
    title: 'Gentle morning routine',
    description: 'A short, simple routine.',
    productIds: ['micellar', 'skin'],
    steps: ['Cleanse gently', 'Moisturize'],
  }), {
    title: 'Gentle morning routine',
    description: 'A short, simple routine.',
    product_ids: ['micellar', 'skin'],
    steps: ['Cleanse gently', 'Moisturize'],
    status: 'pending',
  });
});

test('community routine drafts reject unknown product identifiers', () => {
  assert.throws(() => validateRoutineDraft({
    title: 'Routine', description: 'A valid routine description.', productIds: ['not-a-product'], steps: ['First step', 'Second step']
  }), /unknown product/i);
});
