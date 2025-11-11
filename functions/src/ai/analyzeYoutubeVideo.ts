import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const REGION = "us-central1";
const geminiApiKey = defineSecret("GEMINI_API_KEY");

const resolveApiKey = (): string => {
  const secretKey = geminiApiKey.value();
  if (secretKey?.trim()) {
    return secretKey.trim();
  }

  const envKey = process.env.GEMINI_API_KEY;
  if (envKey?.trim()) {
    return envKey.trim();
  }

  throw new HttpsError(
      "failed-precondition",
      "GEMINI_API_KEY is not configured.",
  );
};

const createPrompt = (exerciseContext?: string) => `
You are Coach Alex, an elite strength and conditioning coach analyzing a workout video.

TASK:
Provide a structured JSON summary of the exercise demonstrated in the video using the following schema:
{
  "exerciseName": string,
  "description": string,
  "muscleGroups": string[],
  "equipment": string[],
  "formCues": string[],
  "programming": {
    "difficulty": "beginner" | "intermediate" | "advanced",
    "volumeRecommendation": {
      "sets": number,
      "reps": string,
      "rest": string
    },
    "tempo": string,
    "progressions": string[],
    "regressions": string[]
  },
  "safetyNotes": string[],
  "coachingTips": string[],
  "videoHighlights": string[]
}

GUIDELINES:
- Base your analysis purely on the video content${exerciseContext ? ` with awareness of the exercise context: ${exerciseContext}.` : "."}
- Use concise coaching-focused language
- Ensure arrays contain at least 2-3 items when applicable
- Always return valid JSON with double quotes and no trailing comments
`.trim();

const parseJson = (raw: string) => {
  const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new HttpsError(
        "internal",
        "Failed to parse analysis response from Gemini.",
        error instanceof Error ? error.message : error,
    );
  }
};

export const analyzeYoutubeVideo = onCall(
    {
      region: REGION,
      timeoutSeconds: 120,
      memory: "1GiB",
      secrets: [geminiApiKey],
    },
    async (request) => {
      const data = request.data ?? {};
      const youtubeUrl = (data.youtubeUrl as string | undefined)?.trim();
      const exerciseContext = (data.exerciseContext as string | undefined)?.trim();

      if (!youtubeUrl) {
        throw new HttpsError(
            "invalid-argument",
            "`youtubeUrl` is required.",
        );
      }

      const apiKey = resolveApiKey();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = createPrompt(exerciseContext);
      const filePart = {
        fileData: {
          mimeType: "video/mp4",
          fileUri: youtubeUrl,
        },
      } as unknown as Part;

      const parts: Part[] = [{ text: prompt }, filePart];

      const result = await model.generateContent(parts);

      const text = result.response.text();
      if (!text) {
        throw new HttpsError(
            "internal",
            "Gemini returned an empty response.",
        );
      }

      const parsed = parseJson(text);
      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new HttpsError(
            "internal",
            "Gemini response was not the expected JSON object.",
        );
      }

      return parsed;
    },
);
