import { COOKIE_NAME } from "@shared/const";
import { ECA_PILLARS } from "@shared/pillars";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { scanUrl } from "./scanner";
import { stripeRouter } from "./stripe-router";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreateSubscription(ctx.user.id);
    }),
  }),

  stripe: stripeRouter,

  audits: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAudits(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        // Check subscription limits
        const subscription = await db.getOrCreateSubscription(ctx.user.id);
        if (
          subscription.plan === "free" &&
          subscription.scansUsedThisMonth >= subscription.scansPerMonth
        ) {
          throw new Error("Limite de scans atingido. Faça upgrade para continuar.");
        }

        // Extract domain from URL
        const urlObj = new URL(input.url);
        const domain = urlObj.hostname;

        // Create audit record
        const result = await db.createAudit(ctx.user.id, input.url, domain);
        const auditId = (result as any).insertId;

        // Increment scan count
        await db.updateSubscription(ctx.user.id, {
          scansUsedThisMonth: subscription.scansUsedThisMonth + 1,
        });

        // Scan URL asynchronously
        scanUrl(input.url)
          .then(async (scanResult) => {
            // Store violations
            for (const violation of scanResult.violations) {
              const violationType = violation.type as "dark_pattern" | "autoplay" | "infinite_scroll" | "ad_tracker" | "lootbox" | "missing_privacy_policy" | "data_collection" | "age_verification" | "other";
              await db.createViolation(auditId, {
                type: violationType,
                severity: violation.severity,
                title: violation.title,
                description: violation.description,
                recommendation: violation.recommendation,
                elementSelector: violation.elementSelector,
              });
            }

            // Update audit with results
            await db.updateAudit(auditId, {
              status: "completed",
              complianceScore: scanResult.complianceScore,
              totalViolations: scanResult.violations.length,
              criticalViolations: scanResult.summary.critical,
              warningViolations: scanResult.summary.warning,
              infoViolations: scanResult.summary.info,
            });
          })
          .catch(async (error) => {
            await db.updateAudit(auditId, {
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
            });
          });

        return { auditId, status: "pending" };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const audit = await db.getAuditById(input.id);
        if (!audit || audit.userId !== ctx.user.id) {
          throw new Error("Auditoria não encontrada");
        }
        const violations = await db.getAuditViolations(input.id);

        const pillars = ECA_PILLARS.map((pillar) => {
          const pillarViolations = violations.filter((v) => v.type === pillar.id);
          return {
            id: pillar.id,
            name: pillar.name,
            weight: pillar.weight,
            passed: pillarViolations.length === 0,
            violations: pillarViolations,
          };
        });

        return { ...audit, violations, pillars };
      }),

    status: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const audit = await db.getAuditById(input.id);
        if (!audit || audit.userId !== ctx.user.id) {
          throw new Error("Auditoria não encontrada");
        }
        return {
          id: audit.id,
          status: audit.status,
          complianceScore: audit.complianceScore,
          errorMessage: (audit as Record<string, unknown>)["errorMessage"] as string | null ?? null,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
