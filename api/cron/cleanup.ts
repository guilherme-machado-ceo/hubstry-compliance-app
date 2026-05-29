import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resetMonthlyScans, deleteOldAudits } from "../../server/db";

/**
 * Vercel Cron endpoint — substitui node-cron (que não funciona em serverless).
 * Executado automaticamente pelo Vercel Cron Scheduler.
 *
 * Configure em vercel.json:
 *   "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }]
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel envia header de autenticação para cron jobs
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Retenção LGPD: exclui auditorias com +90 dias
    const deleted = await deleteOldAudits(90);
    console.log(`[Cron] Retenção LGPD: ${deleted} auditorias excluídas`);

    // Reset mensal de scans (executa todo dia, mas só faz efeito no dia 1)
    const today = new Date().getUTCDate();
    if (today === 1) {
      await resetMonthlyScans();
      console.log("[Cron] Reset mensal de scans executado");
    }

    return res.status(200).json({
      ok: true,
      deleted,
      date: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
