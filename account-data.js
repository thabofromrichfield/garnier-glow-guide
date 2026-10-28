export const PRODUCT_IDS = Object.freeze(['vitc', 'night', 'micellar', 'pure', 'skin', 'superuv']);

export function createScanRecord() {
  // Deliberately excludes images, landmarks, embeddings, and device identifiers.
  return { outcome: 'face_in_frame' };
}

export function validateRoutineDraft({ title, description, productIds, steps }) {
  const cleanTitle = String(title ?? '').trim();
  const cleanDescription = String(description ?? '').trim();
  const cleanProductIds = [...new Set(Array.isArray(productIds) ? productIds : [])];
  const cleanSteps = (Array.isArray(steps) ? steps : [])
    .map((step) => String(step ?? '').trim())
    .filter(Boolean);

  if (cleanTitle.length < 3 || cleanTitle.length > 80) {
    throw new Error('Routine title must be 3–80 characters.');
  }
  if (cleanDescription.length < 10 || cleanDescription.length > 300) {
    throw new Error('Routine description must be 10–300 characters.');
  }
  if (!cleanProductIds.length || cleanProductIds.length > 6) {
    throw new Error('Choose between 1 and 6 products.');
  }
  if (cleanProductIds.some((id) => !PRODUCT_IDS.includes(id))) {
    throw new Error('Routine contains an unknown product.');
  }
  if (cleanSteps.length < 2 || cleanSteps.length > 8 || cleanSteps.some((step) => step.length > 200)) {
    throw new Error('Add 2–8 steps, with no step longer than 200 characters.');
  }

  return {
    title: cleanTitle,
    description: cleanDescription,
    product_ids: cleanProductIds,
    steps: cleanSteps,
    status: 'pending',
  };
}
