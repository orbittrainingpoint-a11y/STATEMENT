import { type AccountSetup, type InsertAccountSetup, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Account Setup methods
  getAccountSetup(id: string): Promise<AccountSetup | undefined>;
  getAllAccountSetups(): Promise<AccountSetup[]>;
  createAccountSetup(setup: InsertAccountSetup): Promise<AccountSetup>;
  updateAccountSetup(id: string, setup: Partial<InsertAccountSetup>): Promise<AccountSetup | undefined>;
  deleteAccountSetup(id: string): Promise<boolean>;

  // Transaction methods
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByAccountSetup(accountSetupId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  deleteTransaction(id: string): Promise<boolean>;
  deleteTransactionsByAccountSetup(accountSetupId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private accountSetups: Map<string, AccountSetup>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.accountSetups = new Map();
    this.transactions = new Map();
  }

  // Account Setup methods
  async getAccountSetup(id: string): Promise<AccountSetup | undefined> {
    return this.accountSetups.get(id);
  }

  async getAllAccountSetups(): Promise<AccountSetup[]> {
    return Array.from(this.accountSetups.values());
  }

  async createAccountSetup(insertSetup: InsertAccountSetup): Promise<AccountSetup> {
    const id = randomUUID();
    const now = new Date();
    const setup: AccountSetup = {
      ...insertSetup,
      id,
      bankLogoUrl: insertSetup.bankLogoUrl || null,
      currency: insertSetup.currency || "AED",
      createdAt: now,
      updatedAt: now,
    };
    this.accountSetups.set(id, setup);
    return setup;
  }

  async updateAccountSetup(id: string, updateData: Partial<InsertAccountSetup>): Promise<AccountSetup | undefined> {
    const existing = this.accountSetups.get(id);
    if (!existing) return undefined;

    const updated: AccountSetup = {
      ...existing,
      ...updateData,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.accountSetups.set(id, updated);
    return updated;
  }

  async deleteAccountSetup(id: string): Promise<boolean> {
    const deleted = this.accountSetups.delete(id);
    if (deleted) {
      // Also delete associated transactions
      await this.deleteTransactionsByAccountSetup(id);
    }
    return deleted;
  }

  // Transaction methods
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByAccountSetup(accountSetupId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.accountSetupId === accountSetupId
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      accountSetupId: insertTransaction.accountSetupId || null,
      debitAmount: insertTransaction.debitAmount || "0.00",
      creditAmount: insertTransaction.creditAmount || "0.00",
      runningBalance: null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async createTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    const createdTransactions: Transaction[] = [];
    for (const insertTransaction of insertTransactions) {
      const created = await this.createTransaction(insertTransaction);
      createdTransactions.push(created);
    }
    return createdTransactions;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  async deleteTransactionsByAccountSetup(accountSetupId: string): Promise<boolean> {
    const transactionsToDelete = Array.from(this.transactions.values()).filter(
      (transaction) => transaction.accountSetupId === accountSetupId
    );
    
    let deleted = false;
    for (const transaction of transactionsToDelete) {
      if (this.transactions.delete(transaction.id)) {
        deleted = true;
      }
    }
    return deleted;
  }
}

export const storage = new MemStorage();
