import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { corsHandler } from "../shared/cors";
import { Request, Response } from "express";

// Define the secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const chatWithGemini = onRequest({ secrets: [geminiApiKey] }, async (req: Request, res: Response) => {
  // Handle CORS
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        console.error("GEMINI_API_KEY not configured");
        res.status(500).json({ error: "Service configuration error" });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Handle both direct calls and httpsCallable wrapped calls
      const data = req.body.data || req.body;
      const { message, history = [], fileUrl } = data;
      console.log("Processing message:", message, "with file:", fileUrl);

      const userMessageParts: any[] = [{ text: message }];

      if (fileUrl) {
        console.log("File URL provided:", fileUrl);
        
        // For Firebase Storage, we need to handle the file differently
        // Assuming the fileUrl is a Firebase Storage URL
        const storage = admin.storage();
        const url = new URL(fileUrl);
        const pathMatch = url.pathname.match(/\/b\/[^/]+\/o\/(.+)/);
        
        if (pathMatch) {
          const filePath = decodeURIComponent(pathMatch[1]);
          console.log("Downloading file from path:", filePath);

          const bucket = storage.bucket();
          const file = bucket.file(filePath);
          
          try {
            const [fileData] = await file.download();
            const mimeType = file.metadata.contentType || "application/octet-stream";
            
            const GeminiFilePart = {
              inlineData: {
                data: fileData.toString("base64"),
                mimeType: mimeType,
              },
            };
            userMessageParts.unshift(GeminiFilePart);
          } catch (downloadError) {
            console.error("Error downloading file:", downloadError);
            throw new Error(`Failed to download file from storage: ${downloadError}`);
          }
        }
      }

      // Convert history messages to proper format
      // Gemini API uses "model" instead of "assistant" for AI responses
      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: msg.parts || [{ text: msg.content || msg.text || '' }]
      }));

      const contents = [
        ...formattedHistory,
        { role: "user", parts: userMessageParts }
      ];

      const generationConfig = {
        maxOutputTokens: 8192,
        temperature: 0.7,
      };

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ];

      const result = await model.generateContent({
        contents: contents,
        generationConfig: generationConfig,
        safetySettings: safetySettings,
        // Remove systemInstruction for now as it's causing issues with the API
      });

      const response = result.response;
      const text = response.text();
      console.log("Generated response:", text);

      // httpsCallable expects response wrapped in 'data' field
      res.status(200).json({ data: { response: text } });
    } catch (error: any) {
      console.error("Error in chat-with-gemini function:", error);
      res.status(500).json({ error: error.message });
    }
  });
});