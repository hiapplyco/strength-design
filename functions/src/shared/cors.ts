import * as cors from "cors";

// CORS configuration for Firebase Functions
export const corsHandler = cors({
  origin: true, // Allow all origins in development, restrict in production
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
});

// Legacy CORS headers for compatibility
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};