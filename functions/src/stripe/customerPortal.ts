import * as functions from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { corsHandler } from "../shared/cors";

// Define the secret
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

const logStep = (step: string, details?: any) => {
  // Sanitize logs - don't log sensitive data
  const sanitizedDetails = details ? {
    ...details,
    email: details.email ? "***@***.***" : undefined,
    customerId: details.customerId ? "cus_***" : undefined,
  } : undefined;

  const detailsStr = sanitizedDetails ? ` - ${JSON.stringify(sanitizedDetails)}` : "";
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

export const customerPortal = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onRequest(async (req, res) => {
  // Handle CORS
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      logStep("Function started");

      // Validate Stripe configuration
      const secretKey = stripeSecretKey.value();
      if (!secretKey) {
        logStep("ERROR: Missing Stripe secret key");
        res.status(500).json({ error: "Service configuration error" });
        return;
      }

      // Validate auth header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logStep("ERROR: Invalid authorization header");
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const token = authHeader.replace("Bearer ", "");

      // Validate token format
      if (!token || token.length < 10) {
        logStep("ERROR: Invalid token format");
        res.status(401).json({ error: "Invalid authentication token" });
        return;
      }

      // Verify Firebase ID token
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (error) {
        logStep("ERROR: Authentication failed", { error: error });
        res.status(401).json({ error: "Authentication failed" });
        return;
      }

      const uid = decodedToken.uid;
      const email = decodedToken.email;

      if (!email) {
        logStep("ERROR: No email found in token");
        res.status(400).json({ error: "Invalid user data" });
        return;
      }

      logStep("User authenticated", { userId: uid });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        logStep("ERROR: Invalid email format");
        res.status(400).json({ error: "Invalid user data" });
        return;
      }

      const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

      // Find customer
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        logStep("ERROR: No Stripe customer found");
        res.status(404).json({ error: "No subscription found for this account" });
        return;
      }

      const customerId = customers.data[0].id;
      logStep("Found Stripe customer");

      // Validate origin header
      const origin = req.headers.origin;
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://strength-design.lovableproject.com",
        // Add your production domain here
      ];

      const returnUrl = allowedOrigins.includes(origin || "") ?
        `${origin}/pricing` : "https://strength-design.lovableproject.com/pricing";

      // Create customer portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logStep("Customer portal session created");

      res.status(200).json({ url: portalSession.url });
    } catch (error) {
      logStep("ERROR", { message: "Unexpected error occurred" });

      res.status(500).json({ error: "Service temporarily unavailable" });
    }
  });
});