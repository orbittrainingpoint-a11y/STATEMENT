import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { List, Trash, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@shared/schema";

interface TransactionTableProps {
  transactions: Transaction[];
  accountSetupId: string;
  isLoading: boolean;
}

export default function TransactionTable({ transactions, accountSetupId, isLoading }: TransactionTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-setups", accountSetupId, "transactions"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const clearAllTransactionsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/account-setups/${accountSetupId}/transactions`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-setups", accountSetupId, "transactions"] });
      toast({
        title: "Success",
        description: "All transactions cleared successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear transactions",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteTransactionMutation.mutate(id);
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all transactions? This action cannot be undone.")) {
      clearAllTransactionsMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <List className="text-primary mr-2 h-5 w-5" />
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-lg">
            <List className="text-primary mr-2 h-5 w-5" />
            Transactions
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground" data-testid="text-total-records">
              Total Records: {transactions.length}
            </span>
            {transactions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                disabled={clearAllTransactionsMutation.isPending}
                data-testid="button-clear-all"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground" data-testid="text-no-transactions">
              No transactions found. Add transactions manually or import from CSV.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Value Date</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={transaction.id} data-testid={`row-transaction-${index}`}>
                    <TableCell data-testid={`text-transaction-date-${index}`}>
                      {formatDate(transaction.transactionDate)}
                    </TableCell>
                    <TableCell data-testid={`text-value-date-${index}`}>
                      {formatDate(transaction.valueDate)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={transaction.narration} data-testid={`text-narration-${index}`}>
                      {transaction.narration}
                    </TableCell>
                    <TableCell 
                      className={`text-right ${parseFloat(transaction.debitAmount) > 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                      data-testid={`text-debit-${index}`}
                    >
                      {parseFloat(transaction.debitAmount) > 0 ? formatCurrency(transaction.debitAmount) : '0.00'}
                    </TableCell>
                    <TableCell 
                      className={`text-right ${parseFloat(transaction.creditAmount) > 0 ? 'text-green-600' : 'text-muted-foreground'}`}
                      data-testid={`text-credit-${index}`}
                    >
                      {parseFloat(transaction.creditAmount) > 0 ? formatCurrency(transaction.creditAmount) : '0.00'}
                    </TableCell>
                    <TableCell 
                      className={`text-right font-medium ${parseFloat(transaction.runningBalance || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      data-testid={`text-running-balance-${index}`}
                    >
                      {formatCurrency(transaction.runningBalance || '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        disabled={deleteTransactionMutation.isPending}
                        className="text-destructive hover:text-destructive/80"
                        data-testid={`button-delete-transaction-${index}`}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
