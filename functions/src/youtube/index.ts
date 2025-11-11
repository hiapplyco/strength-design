import fetch from "node-fetch";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const REGION = "us-central1";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const youtubeApiKey = defineSecret("YOUTUBE_API_KEY");

type YouTubeApiItem = {
  id?: {
    videoId?: string;
  } | string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
      default?: { url?: string };
    };
  };
};

interface SearchOptions {
  maxResults: number;
}

const resolveApiKey = (): string => {
  const secretValue = youtubeApiKey.value();
  if (secretValue?.trim()) {
    return secretValue.trim();
  }

  const envKey = process.env.YOUTUBE_API_KEY;
  if (envKey?.trim()) {
    return envKey.trim();
  }

  throw new HttpsError(
      "failed-precondition",
      "YOUTUBE_API_KEY is not configured.",
  );
};

const toResultItem = (item: YouTubeApiItem) => {
  const snippet = item.snippet ?? {};
  const thumbnails = snippet.thumbnails ?? {};
  const fallbackThumb =
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    "";

  const videoId = typeof item.id === "string"
    ? item.id
    : item.id?.videoId ?? "";

  return {
    id: {
      videoId,
    },
    snippet: {
      title: snippet.title ?? "",
      channelTitle: snippet.channelTitle ?? "",
      description: snippet.description ?? "",
      publishedAt: snippet.publishedAt ?? "",
      thumbnails: {
        medium: {
          url: fallbackThumb,
        },
      },
    },
  };
};

const searchVideos = async (
    query: string,
    apiKey: string,
    options: SearchOptions,
) => {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(options.maxResults),
    key: apiKey,
    videoEmbeddable: "true",
    order: "relevance",
    safeSearch: "strict",
    videoCategoryId: "17",
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params.toString()}`);

  if (!response.ok) {
    let message = `YouTube API request failed with status ${response.status}`;
    try {
      const errorJson = await response.json() as { error?: { message?: string } };
      if (errorJson?.error?.message) {
        message = errorJson.error.message;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = `${message}: ${text}`;
      }
    }

    const code = response.status === 403
      ? "permission-denied"
      : response.status === 400
        ? "invalid-argument"
        : "unknown";

    throw new HttpsError(code, message, {
      status: response.status,
    });
  }

  const json = await response.json() as { items?: YouTubeApiItem[] };
  return Array.isArray(json.items) ? json.items : [];
};

export const searchGenderBalancedVideos = onCall(
    {
      region: REGION,
      secrets: [youtubeApiKey],
    },
    async (request) => {
      const data = request.data ?? {};
      const exerciseName = (data.exerciseName as string | undefined)?.trim();
      if (!exerciseName) {
        throw new HttpsError(
            "invalid-argument",
            "`exerciseName` is required.",
        );
      }

      const rawMaxResults = Number(data.maxResults);
      const maxResults = Number.isFinite(rawMaxResults) && rawMaxResults > 0
        ? Math.min(Math.floor(rawMaxResults), 6)
        : 3;

      const apiKey = resolveApiKey();

      const [maleItems, femaleItems] = await Promise.all([
        searchVideos(`${exerciseName} workout men tutorial`, apiKey, { maxResults }),
        searchVideos(`${exerciseName} workout women tutorial`, apiKey, { maxResults }),
      ]);

      return {
        maleVideos: maleItems.slice(0, 2).map(toResultItem),
        femaleVideos: femaleItems.slice(0, 2).map(toResultItem),
      };
    },
);
