import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../_shared/const.js";
import { ECA_PILLARS } from "../_shared/pillars.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { clearCookieRaw } from "./_core/express5-compat.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { z } from "zod";
import * as db from "./db.js";
import { runAudit, STALE_MESSAGE, STALE_PENDING_MS } from "./audit-runner.js";
import { stripeRouter } from "./stripe-router.js";

/** Fecha auditorias `pending` sem execucao viva antes de lê-las. */
async function closeStalePending(userId: number) {
  await db.failStalePendingAudits(
    userId,
    new Date(Date.now() - STALE_PENDING_MS),
    STALE_MESSAGE,
  );
}

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
      await closeStalePending(ctx.user.id);
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

        if (auditId === undefined) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Não foi possível registrar a auditoria. Tente novamente.",
          });
        }

        // Scan e gravacao terminam antes da resposta, com prazo total
        // (audit-runner.ts). O resultado nunca fica em `pending`.
        const status = await runAudit({
          auditId,
          userId: ctx.user.id,
          url: input.url,
        });

        return { auditId, status };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        await closeStalePending(ctx.user.id);
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
        await closeStalePending(ctx.user.id);
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
