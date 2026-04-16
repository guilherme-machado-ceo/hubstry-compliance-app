import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./dev.db";

export default defineConfig({
  schema: "./drizzle/schema.sqlite.ts",
  out: "./drizzle/migrations-sqlite",
  dialect: "sqlite",
  dbCredentials: { url },
});
