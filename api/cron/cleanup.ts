import { createHash, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resetMonthlyScans, deleteOldAudits } from "../_server/db.js";

/**
 * Compara em tempo constante (hash SHA-256 de tamanho fixo dos dois lados,
 * entao o tamanho do segredo tambem nao vaza pelo tempo de resposta).
 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Vercel Cron endpoint — substitui node-cron (que nao funciona em serverless).
 * Agendado em vercel.json (`crons`): diario, 03:00 UTC.
 *
 * Fail-closed: sem CRON_SECRET configurado o endpoint nao executa nada (503);
 * com segredo, so executa com `Authorization: Bearer <CRON_SECRET>` valido.
 * O valor do segredo nunca e registrado nem devolvido.
 *
 * Retencao: apaga somente auditorias `completed` com mais de 90 dias
 * (ver deleteOldAudits). `failed`/`pending` nao sao apagadas.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const cronSecret = process.env["CRON_SECRET"];

  // Segredo ausente ou vazio: erro de configuracao, nenhuma operacao no banco.
  if (typeof cronSecret !== "string" || cronSecret.trim() === "") {
    console.error("[Cron] CRON_SECRET nao configurado; execucao recusada");
    return res.status(503).json({ error: "Cron not configured" });
  }

  // Vercel envia `Authorization: Bearer <CRON_SECRET>` nas invocacoes do cron.
  const authHeader =
    typeof req.headers["authorization"] === "string"
      ? req.headers["authorization"]
      : undefined;

  if (authHeader === undefined || !safeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Retencao LGPD: exclui auditorias concluidas com +90 dias
    const deleted = await deleteOldAudits(90);
    console.log(
      `[Cron] Retencao LGPD: ${deleted} auditorias excluidas`,
    );

    // Reset mensal de scans (executa todo dia, mas so faz efeito no dia 1 UTC)
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
    // Registra so a mensagem; o corpo da resposta nao expoe detalhes internos.
    console.error(
      "[Cron] Error:",
      error instanceof Error ? error.message : "erro desconhecido",
    );
    return res.status(500).json({ error: "Internal error" });
  }
}
