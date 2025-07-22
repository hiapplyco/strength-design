import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { corsHandler } from "../shared/cors";

const PRICE_ID = "price_1QjidsC3HTLX6YIcMQZNNZjb"; // Pro Program $24.99/mo

export const createCheckout = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      // Validate Stripe configuration
      const stripeKey = functions.config().stripe?.secret_key;
      if (!stripeKey) {
        console.error("Missing Stripe secret key");
        res.status(500).json({ error: "Service configuration error" });
        return;
      }

      const stripe = new Stripe(stripeKey, {
        apiVersion: "2023-10-16",
      });

      // Validate auth header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("Invalid authorization header");
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const token = authHeader.replace("Bearer ", "");

      // Validate token format
      if (!token || token.length < 10) {
        console.error("Invalid token format");
        res.status(401).json({ error: "Invalid authentication token" });
        return;
      }

      // Verify Firebase ID token
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (error) {
        console.error("Token verification failed:", error);
        res.status(401).json({ error: "Authentication failed" });
        return;
      }

      const uid = decodedToken.uid;
      const email = decodedToken.email;

      if (!email) {
        console.error("No email found in token");
        res.status(400).json({ error: "Invalid user data" });
        return;
      }

      console.log(`Creating checkout for user: ${uid}`);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error("Invalid email format");
        res.status(400).json({ error: "Invalid user data" });
        return;
      }

      // Find or create customer
      let customer;
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log("Found existing customer");
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: email,
          metadata: {
            firebase_user_id: uid,
          },
        });
        console.log("Created new customer");
      }

      // Validate origin and construct safe URLs
      const origin = req.headers.origin;
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://strength-design.lovableproject.com",
        // Add your production domain here
      ];

      const baseUrl = allowedOrigins.includes(origin || "") ?
        origin : "https://strength-design.lovableproject.com";

      // Create checkout session
      console.log("Creating checkout session...");
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        line_items: [{price: PRICE_ID, quantity: 1}],
        mode: "subscription",
        success_url: `${baseUrl}/checkout-success`,
        cancel_url: `${baseUrl}/checkout-cancel`,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        payment_method_types: ["card"],
        metadata: {
          firebase_user_id: uid,
        },
      });

      if (!session.url) {
        console.error("Failed to create checkout session URL");
        res.status(500).json({ error: "Failed to create checkout session" });
        return;
      }

      console.log("Checkout session created");

      res.status(200).json({ url: session.url });
    } catch (error) {
      console.error("Error in create-checkout:", error);
      res.status(500).json({ error: "Service temporarily unavailable" });
    }
  });
});