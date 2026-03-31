import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import Stripe from "stripe";
import { STRIPE_PRODUCTS, getPlanByStripePrice } from "./stripe-products";
import * as db from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-03-25.dahlia",
});

export const stripeRouter = router({
  // Create checkout session for Pro or Enterprise plan
  createCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["PRO", "ENTERPRISE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const planDetails = STRIPE_PRODUCTS[input.plan];

      if (!planDetails.priceId) {
        throw new Error("Price ID not configured for this plan");
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          plan: input.plan,
        },
        line_items: [
          {
            price: planDetails.priceId,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        success_url: `${ctx.req.headers.origin || "https://localhost:3000"}/dashboard?payment=success`,
        cancel_url: `${ctx.req.headers.origin || "https://localhost:3000"}/dashboard?payment=cancelled`,
      });

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }),

  // Get subscription details
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await db.getOrCreateSubscription(ctx.user.id);
    return subscription;
  }),

  // Get payment history
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await db.getOrCreateSubscription(ctx.user.id);

    if (!subscription.stripeCustomerId) {
      return [];
    }

    try {
      const invoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 20,
      });

      return invoices.data.map((invoice: Stripe.Invoice) => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000),
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: invoice.status,
        pdfUrl: invoice.invoice_pdf,
      }));
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return [];
    }
  }),

  // Cancel subscription
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await db.getOrCreateSubscription(ctx.user.id);

    if (!subscription.stripeSubscriptionId) {
      throw new Error("No active subscription found");
    }

    try {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      // Update local subscription
      await db.updateSubscription(ctx.user.id, {
        plan: "free",
        stripeSubscriptionId: null,
      });

      return { success: true };
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw new Error("Failed to cancel subscription");
    }
  }),
});

export type StripeRouter = typeof stripeRouter;
