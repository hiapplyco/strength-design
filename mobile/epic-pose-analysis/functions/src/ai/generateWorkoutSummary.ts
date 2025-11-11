import { onRequest } from "firebase-functions/v2/https";
import { corsHandler } from "../shared/cors";
import { Request, Response } from "express";

// TODO: Implement workout summary generation function
export const generateWorkoutSummary = onRequest(async (req: Request, res: Response) => {
  corsHandler(req, res, async () => {
    res.status(501).json({ error: "Workout summary generation function not yet implemented" });
  });
});