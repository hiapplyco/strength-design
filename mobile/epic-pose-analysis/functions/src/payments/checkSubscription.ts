import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { CallableRequest } from "firebase-functions/v2/https";

export const checkSubscription = onCall(async (request: CallableRequest) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    const db = admin.firestore();
    
    // Check user profile for subscription status
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return { 
        subscribed: false,
        status: 'none',
        subscriptionType: null,
        subscriptionEnd: null
      };
    }

    const userData = userDoc.data();
    const subscriptionStatus = userData?.subscriptionStatus || 'none';
    const isSubscribed = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    const subscriptionType = userData?.subscriptionType || null;
    const subscriptionEnd = userData?.subscriptionEnd || null;

    return { 
      subscribed: isSubscribed,
      status: subscriptionStatus,
      subscriptionType: subscriptionType,
      subscriptionEnd: subscriptionEnd
    };
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    throw new HttpsError('internal', 'Failed to check subscription status', error.message);
  }
});