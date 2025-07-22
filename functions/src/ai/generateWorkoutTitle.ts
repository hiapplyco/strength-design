import * as functions from "firebase-functions";
import { corsHandler } from "../shared/cors";

// TODO: Implement workout title generation function
export const generateWorkoutTitle = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    res.status(501).json({ error: "Workout title generation function not yet implemented" });
  });
});