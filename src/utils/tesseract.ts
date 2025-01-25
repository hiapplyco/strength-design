import { OCRClient } from 'tesseract-wasm';

let ocrClient: OCRClient | null = null;

export async function initTesseract() {
  console.log("Initializing Tesseract OCR client");
  if (!ocrClient) {
    try {
      ocrClient = new OCRClient();
      console.log("Loading Tesseract model");
      await ocrClient.loadModel('eng.traineddata');
      console.log("Tesseract model loaded successfully");
    } catch (error) {
      console.error("Error initializing Tesseract:", error);
      throw new Error(`Failed to initialize Tesseract: ${error.message}`);
    }
  }
  return ocrClient;
}

export async function processImageWithTesseract(imageFile: File): Promise<string> {
  try {
    console.log("Starting Tesseract OCR process");
    const client = await initTesseract();
    
    console.log("Converting file to ImageBitmap");
    const imageBlob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type });
    const image = await createImageBitmap(imageBlob);
    
    console.log("Loading image into Tesseract");
    await client.loadImage(image);
    
    console.log("Extracting text from image");
    const text = await client.getText();
    
    console.log("Text extraction complete:", text.substring(0, 100) + "...");
    return text;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error('Failed to process image with Tesseract OCR');
  }
}

export function cleanupTesseract() {
  if (ocrClient) {
    console.log("Cleaning up Tesseract OCR client");
    ocrClient.destroy();
    ocrClient = null;
  }
}