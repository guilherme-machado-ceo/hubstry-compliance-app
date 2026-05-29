const { createClient } = require("@libsql/client");
const client = createClient({
  url: "libsql://hubstry-compliance-guilherme-machado-ceo.aws-us-east-1.turso.io",
  authToken: process.env.DATABASE_AUTH_TOKEN
});
const statements = [
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, openId TEXT NOT NULL UNIQUE, name TEXT, email TEXT, loginMethod TEXT, role TEXT NOT NULL DEFAULT 'user', createdAt INTEGER NOT NULL DEFAULT (unixepoch()), updatedAt INTEGER NOT NULL DEFAULT (unixepoch()), lastSignedIn INTEGER NOT NULL DEFAULT (unixepoch()))",
  "CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL REFERENCES users(id), plan TEXT NOT NULL DEFAULT 'free', scansPerMonth INTEGER NOT NULL DEFAULT 3, scansUsedThisMonth INTEGER NOT NULL DEFAULT 0, stripeCustomerId TEXT, stripeSubscriptionId TEXT, status TEXT NOT NULL DEFAULT 'active', currentPeriodStart INTEGER, currentPeriodEnd INTEGER, createdAt INTEGER NOT NULL DEFAULT (unixepoch()), updatedAt INTEGER NOT NULL DEFAULT (unixepoch()))",
  "CREATE TABLE IF NOT EXISTS audits (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL REFERENCES users(id), url TEXT NOT NULL, domain TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', complianceScore INTEGER, totalViolations INTEGER NOT NULL DEFAULT 0, criticalViolations INTEGER NOT NULL DEFAULT 0, warningViolations INTEGER NOT NULL DEFAULT 0, infoViolations INTEGER NOT NULL DEFAULT 0, htmlContent TEXT, errorMessage TEXT, createdAt INTEGER NOT NULL DEFAULT (unixepoch()), updatedAt INTEGER NOT NULL DEFAULT (unixepoch()))",
  "CREATE TABLE IF NOT EXISTS violations (id INTEGER PRIMARY KEY AUTOINCREMENT, auditId INTEGER NOT NULL REFERENCES audits(id), type TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'info', title TEXT NOT NULL, description TEXT NOT NULL, recommendation TEXT, elementSelector TEXT, lineNumber INTEGER, createdAt INTEGER NOT NULL DEFAULT (unixepoch()))",
  "CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, auditId INTEGER NOT NULL REFERENCES audits(id), userId INTEGER NOT NULL REFERENCES users(id), format TEXT NOT NULL DEFAULT 'pdf', fileUrl TEXT, fileKey TEXT, createdAt INTEGER NOT NULL DEFAULT (unixepoch()))"
];
(async () => {
  for (const sql of statements) {
    await client.execute(sql);
  }
  console.log("Tabelas criadas com sucesso!");
  client.close();
})().catch(err => { console.error("Erro:", err.message); client.close(); });
