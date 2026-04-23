import cron from "node-cron";
import { resetMonthlyScans } from "../db";

// Run on the 1st of each month at midnight UTC
export function registerMonthlyResetJob(): void {
  cron.schedule("0 0 1 * *", () => {
    resetMonthlyScans().catch((err) =>
      console.error("[Jobs] Monthly scan reset failed:", err)
    );
  });
  console.log("[Jobs] Monthly scan reset job registered (runs 1st of each month at 00:00 UTC)");
}
