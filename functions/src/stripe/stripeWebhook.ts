import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const stripeWebhookSecret = functions.config().stripe?.webhook_secret;
  if (!stripeWebhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    res.status(500).json({ error: "Configuration error" });
    return;
  }

  const stripeKey = functions.config().stripe?.secret_key;
  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY not set");
    res.status(500).json({ error: "Configuration error" });
    return;
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16",
  });

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    console.error("No Stripe signature found");
    res.status(400).json({ error: "No signature" });
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      stripeWebhookSecret
    );

    console.log(`Received Stripe webhook: ${event.type}`);

    const db = admin.firestore();

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(
          subscription.customer as string
        ) as Stripe.Customer;

        if (!customer.email) {
          console.error("Customer has no email");
          break;
        }

        // Get the user by email
        const usersSnapshot = await admin.auth().getUserByEmail(customer.email)
          .catch(() => null);

        if (!usersSnapshot) {
          console.error("User not found");
          break;
        }

        const userId = usersSnapshot.uid;

        // Update or create subscription document
        await db.collection("subscriptions").doc(subscription.id).set({
          userId: userId,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id,
          quantity: subscription.items.data[0]?.quantity || 1,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          cancelAt: subscription.cancel_at ?
            new Date(subscription.cancel_at * 1000) : null,
          canceledAt: subscription.canceled_at ?
            new Date(subscription.canceled_at * 1000) : null,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          endedAt: subscription.ended_at ?
            new Date(subscription.ended_at * 1000) : null,
          trialStart: subscription.trial_start ?
            new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ?
            new Date(subscription.trial_end * 1000) : null,
          metadata: subscription.metadata,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // Update user's subscription status
        await db.collection("users").doc(userId).set({
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionPriceId: subscription.items.data[0]?.price.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log(`Subscription ${subscription.id} updated for user ${userId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription status
        await db.collection("subscriptions").doc(subscription.id).update({
          status: "canceled",
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Get the subscription to find the user
        const subDoc = await db.collection("subscriptions").doc(subscription.id).get();
        if (subDoc.exists) {
          const userId = subDoc.data()?.userId;
          if (userId) {
            // Update user's subscription status
            await db.collection("users").doc(userId).update({
              subscriptionStatus: "canceled",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        console.log(`Subscription ${subscription.id} canceled`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        // You can add logic here to send confirmation emails, etc.
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for invoice ${invoice.id}`);
        // You can add logic here to notify users of failed payments
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: error.message });
  }
});