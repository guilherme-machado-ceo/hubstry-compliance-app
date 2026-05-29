import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const";
import { ECA_PILLARS } from "../shared/pillars";
import { getSessionCookieOptions } from "./_core/cookies";
import { clearCookieRaw } from "./_core/express5-compat";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { scanUrl } from "./scanner";
import { stripeRouter } from "./stripe-router";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      clearCookieRaw(ctx.res, COOKIE_NAME, {
        ...cookieOptions,
        maxAge: -1,
      });
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
        // Check subscription limits (-1 means unlimited)
        const subscription = await db.getOrCreateSubscription(
          ctx.user.id,
        );
        const isUnlimited = subscription.scansPerMonth === -1;
        if (
          !isUnlimited &&
          subscription.scansUsedThisMonth >= subscription.scansPerMonth
        ) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Limite de scans atingido. Faca upgrade para continuar.",
          });
        }

        // Extract domain from URL
        const urlObj = new URL(input.url);
        const domain = urlObj.hostname;

        // Create audit record
        const result = await db.createAudit(
          ctx.user.id,
          input.url,
          domain,
        );
        const auditId = (result as Record<string, unknown>)["insertId"] as
          | number
          | undefined;

        // Scan URL asynchronously — increment counter only on success
        scanUrl(input.url)
          .then(async (scanResult) => {
            if (auditId === undefined) return;

            await db.incrementScansUsed(ctx.user.id);

            // Store violations
            for (const violation of scanResult.violations) {
              const violationType = violation.type as
                | "dark_pattern"
                | "autoplay"
                | "infinite_scroll"
                | "ad_tracker"
                | "lootbox"
                | "missing_privacy_policy"
                | "data_collection"
                | "age_verification"
                | "other";
              await db.createViolation(auditId, {
                type: violationType,
                severity: violation.severity,
                title: violation.title,
                description: violation.description,
                recommendation: violation.recommendation,
                elementSelector: violation.elementSelector ?? null,
                lineNumber: null,
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
            if (auditId === undefined) return;
            await db.updateAudit(auditId, {
              status: "failed",
              errorMessage:
                error instanceof Error
                  ? error.message
                  : "Erro desconhecido",
            });
          });

        return { auditId, status: "pending" };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const audit = await db.getAuditById(input.id);
        if (!audit || audit.userId !== ctx.user.id) {
          throw new Error("Auditoria nao encontrada");
        }
        const violations = await db.getAuditViolations(input.id);

        const pillars = ECA_PILLARS.map((pillar) => {
          const pillarViolations = violations.filter(
            (v) => v.type === pillar.id,
          );
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
          throw new Error("Auditoria nao encontrada");
        }
        return {
          id: audit.id,
          status: audit.status,
          complianceScore: audit.complianceScore,
          errorMessage: ((audit as Record<string, unknown>)["errorMessage"] ?? null) as string | null,
        };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAudit(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ── LGPD: Endpoints de exclusao de dados (Art. 18, LGPD) ──────────
  gdpr: router({
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteUserData(ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      clearCookieRaw(ctx.res, COOKIE_NAME, {
        ...cookieOptions,
        maxAge: -1,
      });
      return {
        success: true,
        message:
          "Todos os seus dados foram excluidos conforme Art. 18, III, da LGPD.",
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
