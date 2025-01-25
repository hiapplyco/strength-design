import { OCRClient } from 'tesseract-wasm';

let ocrClient: OCRClient | null = null;

export async function initTesseract() {
  console.log("Initializing Tesseract OCR client");
  if (!ocrClient) {
    try {
      console.log("Creating new OCR client");
      ocrClient = new OCRClient();
      console.log("Loading Tesseract model");
      const modelUrl = '/tesseract/eng.traineddata';
      
      try {
        console.log("Fetching model from:", modelUrl);
        const response = await fetch(modelUrl);
        if (!response.ok) {
          console.error("Failed to fetch model:", response.status, response.statusText);
          throw new Error(`Failed to fetch model file: ${response.statusText}`);
        }
        const modelData = await response.arrayBuffer();
        console.log("Model data fetched, size:", modelData.byteLength);
        await ocrClient.loadModel(new Uint8Array(modelData));
        console.log("Tesseract model loaded successfully");
      } catch (modelError) {
        console.error("Error loading Tesseract model:", modelError);
        throw new Error(`Failed to load Tesseract model: ${modelError.message}`);
      }
    } catch (error) {
      console.error("Error initializing Tesseract:", error);
      ocrClient = null; // Reset the client on error
      throw new Error(`Failed to initialize Tesseract: ${error.message}`);
    }
  }
  return ocrClient;
}

export async function processImageWithTesseract(imageFile: File): Promise<string> {
  try {
    console.log("Starting Tesseract OCR process");
    const client = await initTesseract();
    if (!client) {
      throw new Error("OCR client not initialized");
    }
    
    console.log("Converting file to ImageBitmap");
    const imageBlob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type });
    const image = await createImageBitmap(imageBlob);
    
    console.log("Loading image into Tesseract, dimensions:", image.width, "x", image.height);
    await client.loadImage(image);
    
    console.log("Extracting text from image");
    const text = await client.getText();
    
    if (!text) {
      console.error("No text extracted from image");
      throw new Error("No text was extracted from the image");
    }
    
    console.log("Text extraction complete. Length:", text.length);
    console.log("First 100 chars:", text.substring(0, 100));
    return text;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error(`Failed to process image with Tesseract OCR: ${error.message}`);
  }
}

export function cleanupTesseract() {
  if (ocrClient) {
    console.log("Cleaning up Tesseract OCR client");
    ocrClient.destroy();
    ocrClient = null;
  }
}