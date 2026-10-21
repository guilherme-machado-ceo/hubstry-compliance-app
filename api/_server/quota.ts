import * as db from "./db.js";

/**
 * Contagem da cota mensal derivada das auditorias (db.countQuotaAudits), em
 * vez do contador `scansUsedThisMonth`. Como nao ha um passo separado de
 * "contar", nao ha o que reconciliar: repetir uma requisicao, estourar o
 * prazo ou falhar no meio nunca conta duas vezes nem deixa de contar uma
 * analise concluida. O limite de cada plano nao muda.
 */

/** Inicio do mes corrente em UTC (o saldo reinicia no dia 1º, UTC). */
export function inicioDoMesUtc(agora: Date = new Date()): Date {
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1));
}

/** Assinatura com `scansUsedThisMonth` substituido pela contagem real do mes. */
export async function withUsoDoMes<T extends { scansUsedThisMonth: number }>(
  subscription: T,
  userId: number,
  agora: Date = new Date(),
): Promise<T> {
  const usados = await db.countQuotaAudits(userId, inicioDoMesUtc(agora));
  return { ...subscription, scansUsedThisMonth: usados };
}
