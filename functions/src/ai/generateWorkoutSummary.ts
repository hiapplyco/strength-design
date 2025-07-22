import * as functions from "firebase-functions";
import { corsHandler } from "../shared/cors";

// TODO: Implement workout summary generation function
export const generateWorkoutSummary = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    res.status(501).json({ error: "Workout summary generation function not yet implemented" });
  });
});