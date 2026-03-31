import { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-03-25.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig || !webhookSecret) {
    console.error("[Webhook] Missing signature or webhook secret");
    return res.status(400).json({ error: "Missing signature" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig as string,
      webhookSecret
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Signature verification failed" });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected:", event.type);
    return res.json({ verified: true });
  }

  console.log("[Webhook] Processing event:", event.type, event.id);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("[Webhook] Checkout session completed:", session.id);

  const userId = session.client_reference_id
    ? parseInt(session.client_reference_id)
    : null;

  if (!userId || !session.subscription) {
    console.error("[Webhook] Missing userId or subscription ID");
    return;
  }

  // Get the subscription to determine the plan
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const priceId = subscription.items.data[0]?.price.id;
  let plan: "pro" | "enterprise" = "pro";

  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
    plan = "enterprise";
  }

  // Update user subscription
  await db.updateSubscription(userId, {
    plan,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscription.id,
    scansPerMonth: plan === "enterprise" ? Infinity : Infinity, // Both unlimited
    scansUsedThisMonth: 0,
  });

  console.log(`[Webhook] Updated user ${userId} to plan ${plan}`);

  // Notify owner
  try {
    const user = await db.getUserByOpenId(session.metadata?.customer_email || "");
    if (user) {
      // You can add owner notification here
      console.log(`[Webhook] User ${user.name} upgraded to ${plan}`);
    }
  } catch (error) {
    console.error("[Webhook] Error notifying owner:", error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("[Webhook] Subscription updated:", subscription.id);

  // Find user by stripe subscription ID
  // This would require a query to find user by stripeSubscriptionId
  // For now, we'll skip this as it requires additional DB query capability
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[Webhook] Subscription deleted:", subscription.id);

  // Find user by stripe subscription ID and downgrade to free
  // Similar to above, would need additional DB query capability
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("[Webhook] Invoice paid:", invoice.id);

  // Log payment for audit purposes
  // You can add additional logic here for payment tracking
}
