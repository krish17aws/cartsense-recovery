import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not configured");
  return drizzle(neon(url), { schema });
}

let setupPromise: Promise<void> | null = null;

export function ensureDb() {
  if (!setupPromise) {
    setupPromise = (async () => {
      const db = getDb();
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS cart_snapshots (
          user_id text PRIMARY KEY, customer_name text NOT NULL,
          customer_type text NOT NULL, previous_orders integer NOT NULL DEFAULT 0,
          items_json text NOT NULL DEFAULT '[]',
          item_count integer NOT NULL DEFAULT 0, cart_total integer NOT NULL DEFAULT 0,
          last_activity_at text NOT NULL, status text NOT NULL DEFAULT 'active',
          analysis_json text, analysis_source text, updated_at text NOT NULL
        )
      `));
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS recovery_drafts (
          id text PRIMARY KEY, cart_id text NOT NULL, cart_fingerprint text NOT NULL,
          customer_name text NOT NULL, intent_score integer NOT NULL,
          decision text NOT NULL, message_text text NOT NULL,
          status text NOT NULL DEFAULT 'draft', gemini_calls integer NOT NULL DEFAULT 1,
          created_at text NOT NULL, updated_at text NOT NULL
        )
      `));
    })().catch((error) => { setupPromise = null; throw error; });
  }
  return setupPromise;
}
