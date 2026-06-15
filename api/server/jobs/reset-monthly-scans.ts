import cron from "node-cron";
import { resetMonthlyScans, deleteOldAudits } from "../db";

// Run on the 1st of each month at midnight UTC
export function registerMonthlyResetJob(): void {
  cron.schedule("0 0 1 * *", () => {
    resetMonthlyScans().catch((err) =>
      console.error("[Jobs] Monthly scan reset failed:", err)
    );
  });
  console.log("[Jobs] Monthly scan reset job registered (runs 1st of each month at 00:00 UTC)");

  // LGPD: Retenção de dados — exclui auditorias com mais de 90 dias
  // Executa todo dia às 03:00 UTC
  cron.schedule("0 3 * * *", () => {
    deleteOldAudits(90).catch((err) =>
      console.error("[Jobs] Data retention cleanup failed:", err)
    );
  });
  console.log("[Jobs] LGPD data retention job registered (runs daily at 03:00 UTC, deletes audits older than 90 days)");
}
