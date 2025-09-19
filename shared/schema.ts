import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accountSetups = pgTable("account_setups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankName: text("bank_name").notNull(),
  serviceName: text("service_name").notNull(),
  bankLogoUrl: text("bank_logo_url"),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  currency: text("currency").notNull().default("AED"),
  country: text("country").notNull(),
  address: text("address").notNull(),
  accountType: text("account_type").notNull(),
  iban: text("iban").notNull(),
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).notNull(),
  availableBalance: decimal("available_balance", { precision: 12, scale: 2 }).notNull(),
  fromDate: text("from_date").notNull(),
  toDate: text("to_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountSetupId: varchar("account_setup_id").references(() => accountSetups.id, { onDelete: "cascade" }),
  transactionDate: text("transaction_date").notNull(),
  valueDate: text("value_date").notNull(),
  narration: text("narration").notNull(),
  debitAmount: decimal("debit_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  creditAmount: decimal("credit_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  runningBalance: decimal("running_balance", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountSetupSchema = createInsertSchema(accountSetups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Base schema without validation for use with omit()
export const baseInsertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  runningBalance: true,
  createdAt: true,
});

// Schema with validation for API use
export const insertTransactionSchema = baseInsertTransactionSchema.refine((data) => {
  const debit = parseFloat(data.debitAmount || "0") || 0;
  const credit = parseFloat(data.creditAmount || "0") || 0;
  return (debit > 0 && credit === 0) || (credit > 0 && debit === 0);
}, {
  message: "Exactly one of debit or credit amount must be greater than 0",
  path: ["debitAmount", "creditAmount"],
});

export const updateAccountSetupSchema = insertAccountSetupSchema.partial();

export type InsertAccountSetup = z.infer<typeof insertAccountSetupSchema>;
export type AccountSetup = typeof accountSetups.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// CSV Transaction schema for bulk import
export const csvTransactionSchema = z.object({
  transactionDate: z.string().min(1, "Transaction date is required"),
  valueDate: z.string().min(1, "Value date is required"),
  narration: z.string().min(1, "Narration is required"),
  debitAmount: z.string().default("0.00"),
  creditAmount: z.string().default("0.00"),
}).refine((data) => {
  const debit = parseFloat(data.debitAmount || "0") || 0;
  const credit = parseFloat(data.creditAmount || "0") || 0;
  return (debit > 0 && credit === 0) || (credit > 0 && debit === 0);
}, {
  message: "Exactly one of debit or credit amount must be greater than 0",
  path: ["debitAmount", "creditAmount"],
});

export type CSVTransaction = z.infer<typeof csvTransactionSchema>;
