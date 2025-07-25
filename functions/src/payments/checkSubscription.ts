import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { corsHandler } from "../shared/cors";

export const checkSubscription = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const db = admin.firestore();
      
      // Check user profile for subscription status
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        res.status(200).json({ subscribed: false });
        return;
      }

      const userData = userDoc.data();
      const subscriptionStatus = userData?.subscriptionStatus;
      const isSubscribed = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

      res.status(200).json({ 
        subscribed: isSubscribed,
        status: subscriptionStatus || 'none'
      });
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      res.status(500).json({ error: error.message });
    }
  });
});