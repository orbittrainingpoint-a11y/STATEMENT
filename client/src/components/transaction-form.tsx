import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TransactionFormProps {
  accountSetupId: string;
}

export default function TransactionForm({ accountSetupId }: TransactionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertTransactionSchema.omit({ accountSetupId: true })),
    defaultValues: {
      transactionDate: "",
      valueDate: "",
      narration: "",
      debitAmount: "0.00",
      creditAmount: "0.00",
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/account-setups/${accountSetupId}/transactions`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-setups", accountSetupId, "transactions"] });
      form.reset();
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const debit = parseFloat(data.debitAmount) || 0;
    const credit = parseFloat(data.creditAmount) || 0;

    if (debit === 0 && credit === 0) {
      toast({
        title: "Error",
        description: "Please enter either a debit or credit amount",
        variant: "destructive",
      });
      return;
    }

    createTransactionMutation.mutate({
      ...data,
      debitAmount: debit.toFixed(2),
      creditAmount: credit.toFixed(2),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Plus className="text-primary mr-2 h-5 w-5" />
          Add Transaction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-transaction-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-value-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="narration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narration</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction description" {...field} data-testid="input-narration" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="debitAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Debit Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-debit-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creditAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-credit-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button 
              type="submit" 
              disabled={createTransactionMutation.isPending}
              data-testid="button-add-transaction"
            >
              <Plus className="mr-2 h-4 w-4" />
              {createTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
