import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import * as db from "../../server/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-03-25.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const PRICE_PLAN_MAP: Record<string, { plan: "pro" | "enterprise"; scansPerMonth: number }> = {
  [process.env.STRIPE_PRICE_PRO!]: { plan: "pro", scansPerMonth: 500 },
  [process.env.STRIPE_PRICE_ENTERPRISE!]: { plan: "enterprise", scansPerMonth: -1 },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];

  if (!sig || !webhookSecret) {
    console.error("[Webhook] Missing signature or webhook secret");
    return res.status(400).json({ error: "Missing signature" });
  }

  let event: Stripe.Event;
  let rawBody: Buffer;

  try {
    rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig as string, webhookSecret);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Signature verification failed" });
  }

  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected:", event.type);
    return res.json({ verified: true });
  }

  console.log("[Webhook] Processing event:", event.type, event.id);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ? parseInt(session.client_reference_id) : null;
  if (!userId || !session.subscription) {
    console.error("[Webhook] Missing userId or subscription ID");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0]?.price.id;
  const planDetails = priceId ? PRICE_PLAN_MAP[priceId] : undefined;

  if (!planDetails) {
    console.error(`[Webhook] Unknown priceId "${priceId}" — not updating subscription`);
    return;
  }

  await db.updateSubscription(userId, {
    plan: planDetails.plan,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscription.id,
    scansPerMonth: planDetails.scansPerMonth,
    scansUsedThisMonth: 0,
  });

  console.log(`[Webhook] Updated user ${userId} to plan ${planDetails.plan}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existing = await db.getSubscriptionByStripeId(subscription.id);
  if (!existing) {
    console.warn(`[Webhook] No local subscription found for ${subscription.id}`);
    return;
  }

  const { status } = subscription;
  if (status === "active") return;

  if (status === "past_due" || status === "unpaid") {
    await db.updateSubscription(existing.userId, { plan: "free", scansPerMonth: 5, status });
    return;
  }

  if (status === "canceled" || status === "incomplete_expired") {
    await handleSubscriptionDeleted(subscription);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existing = await db.getSubscriptionByStripeId(subscription.id);
  if (!existing) {
    console.warn(`[Webhook] No local subscription found for ${subscription.id}`);
    return;
  }

  await db.updateSubscription(existing.userId, {
    plan: "free",
    scansPerMonth: 5,
    stripeSubscriptionId: null,
    status: "canceled",
  });

  console.log(`[Webhook] Reverted user ${existing.userId} to free plan`);
}
