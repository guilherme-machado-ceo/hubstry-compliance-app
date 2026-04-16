import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * SQLite-compatible mirror of drizzle/schema.ts.
 * Used for local development (DATABASE_PROVIDER=sqlite).
 * Differences from MySQL schema:
 *   - mysqlTable → sqliteTable
 *   - int → integer
 *   - varchar/text → text (SQLite has one text type)
 *   - mysqlEnum → text with { enum: [...] }
 *   - timestamp → integer with { mode: "timestamp" }
 *   - onUpdateNow() not available in SQLite (omitted)
 */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  plan: text("plan", { enum: ["free", "pro", "enterprise"] })
    .default("free")
    .notNull(),
  scansPerMonth: integer("scansPerMonth").default(3).notNull(),
  scansUsedThisMonth: integer("scansUsedThisMonth").default(0).notNull(),
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  status: text("status", { enum: ["active", "canceled", "past_due"] })
    .default("active")
    .notNull(),
  currentPeriodStart: integer("currentPeriodStart", { mode: "timestamp" }),
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const audits = sqliteTable("audits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  status: text("status", {
    enum: ["pending", "scanning", "completed", "failed"],
  })
    .default("pending")
    .notNull(),
  complianceScore: integer("complianceScore"),
  totalViolations: integer("totalViolations").default(0).notNull(),
  criticalViolations: integer("criticalViolations").default(0).notNull(),
  warningViolations: integer("warningViolations").default(0).notNull(),
  infoViolations: integer("infoViolations").default(0).notNull(),
  htmlContent: text("htmlContent"),
  errorMessage: text("errorMessage"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const violations = sqliteTable("violations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  auditId: integer("auditId")
    .notNull()
    .references(() => audits.id),
  type: text("type", {
    enum: [
      "dark_pattern",
      "autoplay",
      "infinite_scroll",
      "ad_tracker",
      "lootbox",
      "missing_privacy_policy",
      "data_collection",
      "age_verification",
      "other",
    ],
  }).notNull(),
  severity: text("severity", { enum: ["critical", "warning", "info"] })
    .default("info")
    .notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation"),
  elementSelector: text("elementSelector"),
  lineNumber: integer("lineNumber"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  auditId: integer("auditId")
    .notNull()
    .references(() => audits.id),
  userId: integer("userId")
    .notNull()
    .references(() => users.id),
  format: text("format", { enum: ["pdf", "json", "html"] })
    .default("pdf")
    .notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Audit = typeof audits.$inferSelect;
export type InsertAudit = typeof audits.$inferInsert;
export type Violation = typeof violations.$inferSelect;
export type InsertViolation = typeof violations.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
