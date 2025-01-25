import { OCRClient } from 'tesseract-wasm';

let ocrClient: OCRClient | null = null;

export async function initTesseract() {
  console.log("[Tesseract] Starting initialization");
  if (!ocrClient) {
    try {
      console.log("[Tesseract] Creating new OCR client");
      ocrClient = new OCRClient();
      console.log("[Tesseract] Loading model");
      const modelUrl = '/tesseract/eng.traineddata';
      
      try {
        console.log("[Tesseract] Fetching model from:", modelUrl);
        const response = await fetch(modelUrl);
        if (!response.ok) {
          console.error("[Tesseract] Failed to fetch model:", response.status, response.statusText);
          throw new Error(`Failed to fetch model file: ${response.statusText}`);
        }
        const modelData = await response.arrayBuffer();
        console.log("[Tesseract] Model data fetched, size:", modelData.byteLength);
        
        console.log("[Tesseract] Loading model into client");
        await ocrClient.loadModel(new Uint8Array(modelData));
        console.log("[Tesseract] Model loaded successfully");
      } catch (modelError) {
        console.error("[Tesseract] Error loading model:", modelError);
        ocrClient = null;
        throw new Error(`Failed to load Tesseract model: ${modelError.message}`);
      }
    } catch (error) {
      console.error("[Tesseract] Error initializing:", error);
      ocrClient = null;
      throw new Error(`Failed to initialize Tesseract: ${error.message}`);
    }
  } else {
    console.log("[Tesseract] Client already initialized");
  }
  return ocrClient;
}

export async function processImageWithTesseract(imageFile: File): Promise<string> {
  try {
    console.log("[Tesseract] Starting OCR process");
    const client = await initTesseract();
    if (!client) {
      console.error("[Tesseract] Client not initialized");
      throw new Error("OCR client not initialized");
    }
    
    console.log("[Tesseract] Converting file to ImageBitmap");
    const imageBlob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type });
    const image = await createImageBitmap(imageBlob);
    console.log("[Tesseract] Image converted, dimensions:", image.width, "x", image.height);
    
    console.log("[Tesseract] Loading image into client");
    await client.loadImage(image);
    console.log("[Tesseract] Image loaded successfully");
    
    console.log("[Tesseract] Starting text extraction");
    const text = await client.getText();
    console.log("[Tesseract] Text extraction completed");
    
    if (!text) {
      console.error("[Tesseract] No text extracted from image");
      throw new Error("No text was extracted from the image");
    }
    
    console.log("[Tesseract] Text extraction successful. Length:", text.length);
    console.log("[Tesseract] First 100 chars:", text.substring(0, 100));
    return text;
  } catch (error) {
    console.error('[Tesseract] OCR error:', error);
    throw new Error(`Failed to process image with Tesseract OCR: ${error.message}`);
  }
}

export function cleanupTesseract() {
  if (ocrClient) {
    console.log("[Tesseract] Cleaning up OCR client");
    ocrClient.destroy();
    ocrClient = null;
  }
}