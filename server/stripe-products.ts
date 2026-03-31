/**
 * Stripe Products and Prices Configuration
 * These are the product definitions for Hubstry Compliance plans
 */

export const STRIPE_PRODUCTS = {
  FREE: {
    name: "Free",
    description: "Plano gratuito com limite de 3 scans por mês",
    scansPerMonth: 3,
    features: [
      "3 scans por mês",
      "Relatórios básicos",
      "Score de conformidade",
      "Detecção de violações",
    ],
  },
  PRO: {
    name: "Pro",
    description: "Plano profissional com scans ilimitados",
    scansPerMonth: Infinity,
    priceId: process.env.STRIPE_PRICE_PRO || "price_pro_placeholder",
    price: 29.99, // USD per month
    features: [
      "Scans ilimitados",
      "Relatórios detalhados",
      "Exportação em PDF",
      "Histórico completo",
      "Suporte por email",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "Plano enterprise com API access",
    scansPerMonth: Infinity,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise_placeholder",
    price: 99.99, // USD per month
    features: [
      "Scans ilimitados",
      "API access",
      "Relatórios avançados",
      "Exportação em PDF",
      "Histórico completo",
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
