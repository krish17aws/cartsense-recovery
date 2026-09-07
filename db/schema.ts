import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const recoveryDrafts = pgTable("recovery_drafts", {
  id: text("id").primaryKey(),
  cartId: text("cart_id").notNull(),
  cartFingerprint: text("cart_fingerprint").notNull(),
  customerName: text("customer_name").notNull(),
  intentScore: integer("intent_score").notNull(),
  decision: text("decision").notNull(),
  messageText: text("message_text").notNull(),
  status: text("status").notNull().default("draft"),
  geminiCalls: integer("gemini_calls").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const cartSnapshots = pgTable("cart_snapshots", {
  userId: text("user_id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerType: text("customer_type").notNull(),
  previousOrders: integer("previous_orders").notNull().default(0),
  itemsJson: text("items_json").notNull().default("[]"),
  itemCount: integer("item_count").notNull().default(0),
  cartTotal: integer("cart_total").notNull().default(0),
  lastActivityAt: text("last_activity_at").notNull(),
  status: text("status").notNull().default("active"),
  analysisJson: text("analysis_json"),
  analysisSource: text("analysis_source"),
  updatedAt: text("updated_at").notNull(),
});
