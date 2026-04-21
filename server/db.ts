import { desc, eq, sql } from "drizzle-orm";
// Import MySQL schema for TypeScript types (canonical type source)
import type { Audit, InsertUser, Violation } from "../drizzle/schema";
import * as mysqlSchema from "../drizzle/schema";
import { ENV } from "./_core/env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = any;

let _db: AnyDb = null;
let _schema: AnySchema = mysqlSchema;
let _provider = "mysql";
let _initialized = false;

async function initDb() {
  if (_initialized) return;
  _initialized = true;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[Database] DATABASE_URL not set, running without DB");
    return;
  }

  _provider = process.env.DATABASE_PROVIDER ?? "mysql";

  try {
    if (_provider === "sqlite") {
      const { drizzle } = await import("drizzle-orm/libsql");
      const { createClient } = await import("@libsql/client");
      const client = createClient({ url });
      _db = drizzle(client);
      _schema = await import("../drizzle/schema.sqlite");
    } else {
      const { drizzle } = await import("drizzle-orm/mysql2");
      _db = drizzle(url);
      _schema = mysqlSchema;
    }
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
    _db = null;
  }
}

export async function getDb(): Promise<AnyDb> {
  await initDb();
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const { users } = _schema;

  try {
    const values: Record<string, unknown> = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      const value = user[field];
      if (value === undefined) continue;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    if (_provider === "sqlite") {
      await db
        .insert(users)
        .values(values)
        .onConflictDoUpdate({ target: users.openId, set: updateSet });
    } else {
      await db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const { users } = _schema;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? (result[0] as Audit) : undefined;
}

export async function getOrCreateSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = _schema;
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(subscriptions).values({
    userId,
    plan: "free",
    scansPerMonth: 5,
    scansUsedThisMonth: 0,
  });

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return result[0];
}

export async function updateSubscription(
  userId: number,
  updates: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = _schema;
  await db
    .update(subscriptions)
    .set(updates)
    .where(eq(subscriptions.userId, userId));
}

export async function resetMonthlyScans(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[DB] Database not available — skipping monthly reset");
    return;
  }

  const { subscriptions } = _schema;
  await db.update(subscriptions).set({ scansUsedThisMonth: 0 });
  console.log("[DB] Monthly scan counters reset");
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = _schema;
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementScansUsed(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = _schema;
  await db
    .update(subscriptions)
    .set({
      scansUsedThisMonth: sql`${subscriptions.scansUsedThisMonth} + 1`,
    })
    .where(eq(subscriptions.userId, userId));
}

export async function createAudit(
  userId: number,
  url: string,
  domain: string
): Promise<{ insertId: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits } = _schema;

  if (_provider === "sqlite") {
    const rows = await db
      .insert(audits)
      .values({ userId, url, domain, status: "pending" })
      .returning({ id: audits.id });
    return { insertId: rows[0].id };
  }

  const result = await db
    .insert(audits)
    .values({ userId, url, domain, status: "pending" });
  return result as { insertId: number };
}

export async function getAuditById(auditId: number): Promise<Audit | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits } = _schema;
  const result = await db
    .select()
    .from(audits)
    .where(eq(audits.id, auditId))
    .limit(1);
  return result[0] as Audit | undefined;
}

export async function getUserAudits(
  userId: number,
  limit = 20,
  offset = 0
): Promise<Audit[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits } = _schema;
  return db
    .select()
    .from(audits)
    .where(eq(audits.userId, userId))
    .orderBy(desc(audits.createdAt))
    .limit(limit)
    .offset(offset) as Promise<Audit[]>;
}

export async function updateAudit(
  auditId: number,
  updates: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits } = _schema;
  await db.update(audits).set(updates).where(eq(audits.id, auditId));
}

export async function createViolation(
  auditId: number,
  violation: Omit<Violation, "id" | "auditId" | "createdAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { violations } = _schema;
  return db.insert(violations).values({ ...violation, auditId });
}

export async function getAuditViolations(auditId: number): Promise<Violation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { violations } = _schema;
  return db
    .select()
    .from(violations)
    .where(eq(violations.auditId, auditId))
    .orderBy(violations.severity) as Promise<Violation[]>;
}
