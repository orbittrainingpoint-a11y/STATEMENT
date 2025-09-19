import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAccountSetupSchema, insertTransactionSchema, csvTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Account Setup Routes
  app.get("/api/account-setups", async (req, res) => {
    try {
      const setups = await storage.getAllAccountSetups();
      res.json(setups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account setups" });
    }
  });

  app.get("/api/account-setups/:id", async (req, res) => {
    try {
      const setup = await storage.getAccountSetup(req.params.id);
      if (!setup) {
        return res.status(404).json({ message: "Account setup not found" });
      }
      res.json(setup);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account setup" });
    }
  });

  app.post("/api/account-setups", async (req, res) => {
    try {
      const validatedData = insertAccountSetupSchema.parse(req.body);
      const setup = await storage.createAccountSetup(validatedData);
      res.status(201).json(setup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create account setup" });
    }
  });

  app.patch("/api/account-setups/:id", async (req, res) => {
    try {
      const validatedData = insertAccountSetupSchema.partial().parse(req.body);
      const updated = await storage.updateAccountSetup(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: "Account setup not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update account setup" });
    }
  });

  app.delete("/api/account-setups/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAccountSetup(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Account setup not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account setup" });
    }
  });

  // Transaction Routes
  app.get("/api/account-setups/:accountSetupId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByAccountSetup(req.params.accountSetupId);
      
      // Sort by transaction date (newest first) and calculate running balances
      const sortedTransactions = transactions.sort((a, b) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );

      // Calculate running balances
      const setup = await storage.getAccountSetup(req.params.accountSetupId);
      if (setup) {
        let runningBalance = parseFloat(setup.currentBalance);
        
        // Sort oldest first for balance calculation
        const balanceTransactions = [...sortedTransactions].reverse();
        balanceTransactions.forEach(transaction => {
          runningBalance = runningBalance - parseFloat(transaction.debitAmount) + parseFloat(transaction.creditAmount);
          transaction.runningBalance = runningBalance.toString();
        });
      }

      res.json(sortedTransactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/account-setups/:accountSetupId/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        accountSetupId: req.params.accountSetupId,
      });
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.post("/api/account-setups/:accountSetupId/transactions/bulk", async (req, res) => {
    try {
      const { transactions: csvTransactions } = req.body;
      
      if (!Array.isArray(csvTransactions)) {
        return res.status(400).json({ message: "Transactions must be an array" });
      }

      const validatedTransactions = csvTransactions.map(transaction => 
        insertTransactionSchema.parse({
          ...transaction,
          accountSetupId: req.params.accountSetupId,
        })
      );

      const createdTransactions = await storage.createTransactions(validatedTransactions);
      res.status(201).json(createdTransactions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transactions" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTransaction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  app.delete("/api/account-setups/:accountSetupId/transactions", async (req, res) => {
    try {
      await storage.deleteTransactionsByAccountSetup(req.params.accountSetupId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
