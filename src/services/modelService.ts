
// This file handles downloading and serving models

// CDN URLs for face-api.js models
const MODEL_URLS = {
  tinyFaceDetector: 'https://justadudewhohacks.github.io/face-api.js/models/tiny_face_detector_model-weights_manifest.json',
  faceExpression: 'https://justadudewhohacks.github.io/face-api.js/models/face_expression_model-weights_manifest.json',
  faceLandmark68: 'https://justadudewhohacks.github.io/face-api.js/models/face_landmark_68_model-weights_manifest.json',
  faceRecognition: 'https://justadudewhohacks.github.io/face-api.js/models/face_recognition_model-weights_manifest.json'
};

export const ensureModelsLoaded = async (): Promise<void> => {
  console.log('Ensuring models are loaded from CDN...');
  // No checks needed - we'll use direct CDN URLs instead of downloading
  return Promise.resolve();
};

// Get model URL from CDN instead of local path
export const getModelURL = (modelName: string): string => {
  // Return the base CDN path for all models
  return 'https://justadudewhohacks.github.io/face-api.js/models';
};
