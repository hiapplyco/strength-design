import { OCRClient } from 'tesseract-wasm';

let ocrClient: OCRClient | null = null;

export async function initTesseract() {
  if (!ocrClient) {
    ocrClient = new OCRClient();
    const modelUrl = '/tesseract/eng.traineddata';
    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch model file: ${response.statusText}`);
    }
    const modelData = await response.arrayBuffer();
    await ocrClient.loadModel(new Uint8Array(modelData));
  }
  return ocrClient;
}

export async function processImageWithTesseract(imageFile: File): Promise<string> {
  const client = await initTesseract();
  if (!client) {
    throw new Error("OCR client not initialized");
  }

  // Create a canvas to draw the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Load image into ImageBitmap
  const imageBlob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type });
  const image = await createImageBitmap(imageBlob);
  
  // Set canvas dimensions to match image
  canvas.width = image.width;
  canvas.height = image.height;
  
  // Draw image to canvas
  ctx.drawImage(image, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Load image data into OCR client
  await client.loadImage(imageData);
  
  // Get text
  const text = await client.getText();
  if (!text) {
    throw new Error("No text was extracted from the image");
  }
  
  return text;
}

export function cleanupTesseract() {
  if (ocrClient) {
    ocrClient.destroy();
    ocrClient = null;
  }
}