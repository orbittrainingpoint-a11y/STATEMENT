import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { List, Trash, Trash2, Download } from "lucide-react";
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

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = [
      'Transaction Date',
      'Value Date', 
      'Narration',
      'Debit Amount',
      'Credit Amount',
      'Running Balance'
    ];
    
    const csvContent = [
      headers.join(','),
      ...transactions.map(transaction => [
        `"${formatDate(transaction.transactionDate)}"`,
        `"${formatDate(transaction.valueDate)}"`,
        `"${transaction.narration.replace(/"/g, '""')}"`,
        formatCurrency(transaction.debitAmount),
        formatCurrency(transaction.creditAmount),
        formatCurrency(transaction.runningBalance || '0')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_march_2024.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "Transactions exported to CSV successfully",
    });
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
            <span className="text-sm font-medium text-gray-600" data-testid="text-total-records">
              Total Records: {transactions.length}
            </span>
            {transactions.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  data-testid="button-export-csv"
                  className="mr-2"
                >
                  <Download className="mr-1 h-4 w-4" />
                  Export CSV
                </Button>
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
              </>
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
            <Table className="border border-gray-300">
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-300">
                  <TableHead className="border-r border-gray-300 font-semibold text-gray-700 text-center py-3">
                    Transaction Date
                  </TableHead>
                  <TableHead className="border-r border-gray-300 font-semibold text-gray-700 text-center py-3">
                    Value Date
                  </TableHead>
                  <TableHead className="border-r border-gray-300 font-semibold text-gray-700 text-center py-3 min-w-[300px]">
                    Narration
                  </TableHead>
                  <TableHead className="border-r border-gray-300 font-semibold text-gray-700 text-center py-3">
                    Debit
                  </TableHead>
                  <TableHead className="border-r border-gray-300 font-semibold text-gray-700 text-center py-3">
                    Credit
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center py-3">
                    Running Balance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={transaction.id} data-testid={`row-transaction-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="border-r border-gray-200 text-center py-3" data-testid={`text-transaction-date-${index}`}>
                      {formatDate(transaction.transactionDate)}
                    </TableCell>
                    <TableCell className="border-r border-gray-200 text-center py-3" data-testid={`text-value-date-${index}`}>
                      {formatDate(transaction.valueDate)}
                    </TableCell>
                    <TableCell className="border-r border-gray-200 py-3 px-4" data-testid={`text-narration-${index}`}>
                      <div className="whitespace-normal text-sm leading-relaxed">
                        {transaction.narration}
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-gray-200 text-right py-3 pr-4" data-testid={`text-debit-${index}`}>
                      {parseFloat(transaction.debitAmount) > 0 ? formatCurrency(transaction.debitAmount) : '0.00'}
                    </TableCell>
                    <TableCell className="border-r border-gray-200 text-right py-3 pr-4" data-testid={`text-credit-${index}`}>
                      {parseFloat(transaction.creditAmount) > 0 ? formatCurrency(transaction.creditAmount) : '0.00'}
                    </TableCell>
                    <TableCell className="text-right py-3 pr-4 font-medium" data-testid={`text-running-balance-${index}`}>
                      {formatCurrency(transaction.runningBalance || '0')}
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
