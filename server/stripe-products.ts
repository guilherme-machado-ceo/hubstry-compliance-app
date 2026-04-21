/**
 * Stripe Products and Prices Configuration
 * These are the product definitions for Hubstry Compliance plans.
 * scansPerMonth: -1 means unlimited.
 */

export const PLANS = {
  free: {
    scansPerMonth: 5,
    features: ["scan_basic"] as const,
  },
  pro: {
    scansPerMonth: 500,
    features: ["scan_basic", "pdf_export", "history_90d"] as const,
  },
  enterprise: {
    scansPerMonth: -1,
    features: [
      "scan_basic",
      "pdf_export",
      "history_unlimited",
      "api_access",
      "priority_support",
      "custom_webhooks",
    ] as const,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// Legacy STRIPE_PRODUCTS kept for reference; authoritative data is PLANS above.
export const STRIPE_PRODUCTS = {
  FREE: {
    name: "Free",
    description: "Plano gratuito com 5 scans por mês",
    scansPerMonth: PLANS.free.scansPerMonth,
    features: [
      "5 scans por mês",
      "Relatórios básicos",
      "Score de conformidade",
      "Detecção de violações",
    ],
  },
  PRO: {
    name: "Pro",
    description: "Plano profissional — 500 scans/mês",
    scansPerMonth: PLANS.pro.scansPerMonth,
    priceId: process.env.STRIPE_PRICE_PRO || "price_pro_placeholder",
    price: 29.99,
    features: [
      "500 scans por mês",
      "Relatórios detalhados",
      "Exportação em PDF",
      "Histórico 90 dias",
      "Suporte por email",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "Plano enterprise — scans ilimitados e API access",
    scansPerMonth: PLANS.enterprise.scansPerMonth,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise_placeholder",
    price: 99.99,
    features: [
      "Scans ilimitados",
      "API access",
      "Relatórios avançados",
      "Exportação em PDF",
      "Histórico ilimitado",
      "Suporte prioritário",
      "Webhooks customizados",
      "SLA garantido",
    ],
  },
};

export type PlanType = keyof typeof STRIPE_PRODUCTS;

export function getPlanByStripePrice(priceId: string): PlanType | null {
  if (priceId === STRIPE_PRODUCTS.PRO.priceId) return "PRO";
  if (priceId === STRIPE_PRODUCTS.ENTERPRISE.priceId) return "ENTERPRISE";
  return null;
}

export function getPlanDetails(plan: PlanType) {
  return STRIPE_PRODUCTS[plan];
}
