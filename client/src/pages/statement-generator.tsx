import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import SetupForm from "@/components/setup-form";
import TransactionForm from "@/components/transaction-form";
import TransactionTable from "@/components/transaction-table";
import StatementPreview from "@/components/statement-preview";
import CSVUpload from "@/components/csv-upload";
import { generatePDF } from "@/lib/pdf-generator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AccountSetup, Transaction } from "@shared/schema";

export default function StatementGenerator() {
  const [activeTab, setActiveTab] = useState("setup");
  const [currentAccountSetupId, setCurrentAccountSetupId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: accountSetups = [], isLoading: loadingSetups } = useQuery<AccountSetup[]>({
    queryKey: ["/api/account-setups"],
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/account-setups", currentAccountSetupId, "transactions"],
    enabled: !!currentAccountSetupId,
  });

  const currentSetup = currentAccountSetupId 
    ? accountSetups.find((setup: AccountSetup) => setup.id === currentAccountSetupId)
    : accountSetups[0];

  // Mutations
  const createSetupMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/account-setups", data);
      return res.json();
    },
    onSuccess: (newSetup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-setups"] });
      setCurrentAccountSetupId(newSetup.id);
      setActiveTab("transactions");
    },
  });

  const updateSetupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/account-setups/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-setups"] });
    },
  });

  const handleExportPDF = async () => {
    if (currentSetup) {
      await generatePDF(currentSetup, transactions);
    }
  };

  const tabs = [
    { id: "setup", label: "Setup", icon: "⚙️" },
    { id: "transactions", label: "Transactions", icon: "📋" },
    { id: "preview", label: "Preview Statement", icon: "👁️" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <FileText className="text-primary text-2xl" />
              <h1 className="text-xl font-semibold text-foreground">Account Statement Generator</h1>
            </div>
            <Button
              onClick={handleExportPDF}
              disabled={!currentSetup || transactions.length === 0}
              data-testid="button-export-pdf"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`button-tab-${tab.id}`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "setup" && (
            <SetupForm
              setup={currentSetup}
              onSave={(data) => {
                if (currentSetup) {
                  updateSetupMutation.mutate({ id: currentSetup.id, data });
                } else {
                  createSetupMutation.mutate(data);
                }
              }}
              isLoading={createSetupMutation.isPending || updateSetupMutation.isPending}
            />
          )}

          {activeTab === "transactions" && currentSetup && (
            <div className="space-y-6">
              <TransactionForm accountSetupId={currentSetup.id} />
              <CSVUpload accountSetupId={currentSetup.id} />
              <TransactionTable
                transactions={transactions}
                accountSetupId={currentSetup.id}
                isLoading={loadingTransactions}
              />
            </div>
          )}

          {activeTab === "preview" && currentSetup && (
            <StatementPreview
              setup={currentSetup}
              transactions={transactions}
            />
          )}

          {activeTab === "transactions" && !currentSetup && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Please complete the setup first to manage transactions.</p>
              <Button 
                onClick={() => setActiveTab("setup")} 
                className="mt-4"
                data-testid="button-setup-first"
              >
                Go to Setup
              </Button>
            </Card>
          )}

          {activeTab === "preview" && !currentSetup && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Please complete the setup first to preview the statement.</p>
              <Button 
                onClick={() => setActiveTab("setup")} 
                className="mt-4"
                data-testid="button-setup-first-preview"
              >
                Go to Setup
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
