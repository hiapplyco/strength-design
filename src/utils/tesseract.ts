import { OCRClient } from 'tesseract-wasm';

let ocrClient: OCRClient | null = null;

export async function initTesseract() {
  if (!ocrClient) {
    ocrClient = new OCRClient();
    await ocrClient.loadModel('eng.traineddata');
  }
  return ocrClient;
}

export async function processImageWithTesseract(imageFile: File): Promise<string> {
  try {
    const client = await initTesseract();
    const imageBlob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type });
    const image = await createImageBitmap(imageBlob);
    
    await client.loadImage(image);
    const text = await client.getText();
    
    return text;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error('Failed to process image with Tesseract OCR');
  }
}

export function cleanupTesseract() {
  if (ocrClient) {
    ocrClient.destroy();
    ocrClient = null;
  }
}