import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccountSetup, Transaction } from "@shared/schema";

interface StatementPreviewProps {
  setup: AccountSetup;
  transactions: Transaction[];
}

export default function StatementPreview({ setup, transactions }: StatementPreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8" data-testid="card-statement-preview">
        {/* Statement Header */}
        <div className="border-b-2 border-primary pb-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-lg font-medium text-foreground" data-testid="text-service-name">
                {setup.serviceName}
              </span>
            </div>
            <div className="text-right">
              {setup.bankLogoUrl && (
                <img 
                  src={setup.bankLogoUrl} 
                  alt={setup.bankName}
                  className="h-8 mb-2"
                  data-testid="img-bank-logo"
                />
              )}
              <span className="text-lg font-semibold text-primary" data-testid="text-bank-name">
                {setup.bankName}
              </span>
            </div>
          </div>
        </div>

        {/* Statement Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground mb-2" data-testid="text-statement-title">
            Account Statement
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="text-generated-date">
            Generated {currentDate} by MOHAMMED ALI
          </p>
        </div>

        {/* Account Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2" data-testid="text-account-info-title">
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Number</span>
              <span className="text-foreground font-medium" data-testid="text-account-number">{setup.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name</span>
              <span className="text-foreground font-medium" data-testid="text-account-name">{setup.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency</span>
              <span className="text-foreground font-medium" data-testid="text-currency">{setup.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country</span>
              <span className="text-foreground font-medium" data-testid="text-country">{setup.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Type</span>
              <span className="text-foreground font-medium" data-testid="text-account-type">{setup.accountType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IBAN</span>
              <span className="text-foreground font-medium" data-testid="text-iban">{setup.iban}</span>
            </div>
            <div className="flex justify-between md:col-span-2">
              <span className="text-muted-foreground">Registered Address</span>
              <span className="text-foreground font-medium text-right" data-testid="text-address">{setup.address}</span>
            </div>
          </div>
        </div>

        {/* Balance Information Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2" data-testid="text-balance-info-title">
            Balance Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="text-foreground font-medium" data-testid="text-current-balance">
                {formatCurrency(setup.currentBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Effective Available Balance</span>
              <span className="text-foreground font-medium" data-testid="text-available-balance">
                {formatCurrency(setup.availableBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uncleared Balance</span>
              <span className="text-foreground font-medium">0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Status</span>
              <span className="text-foreground font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Account Statement Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2" data-testid="text-statement-section-title">
              Account Statement
            </h2>
            <span className="text-sm text-muted-foreground" data-testid="text-total-records-preview">
              Total Records: {transactions.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-statement-period">
            From: {formatDate(setup.fromDate)} to {formatDate(setup.toDate)}
          </p>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8 border border-border rounded-md">
              <p className="text-muted-foreground" data-testid="text-no-transactions-preview">
                No transactions found for the selected period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-medium text-foreground">Transaction Date</TableHead>
                    <TableHead className="font-medium text-foreground">Value Date</TableHead>
                    <TableHead className="font-medium text-foreground">Narration</TableHead>
                    <TableHead className="font-medium text-foreground text-right">Debit</TableHead>
                    <TableHead className="font-medium text-foreground text-right">Credit</TableHead>
                    <TableHead className="font-medium text-foreground text-right">Running Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow key={transaction.id} className="border-b border-border last:border-b-0" data-testid={`row-preview-transaction-${index}`}>
                      <TableCell className="text-foreground" data-testid={`text-preview-transaction-date-${index}`}>
                        {formatDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell className="text-foreground" data-testid={`text-preview-value-date-${index}`}>
                        {formatDate(transaction.valueDate)}
                      </TableCell>
                      <TableCell className="text-foreground text-xs leading-tight" data-testid={`text-preview-narration-${index}`}>
                        {transaction.narration}
                      </TableCell>
                      <TableCell 
                        className={`text-right ${parseFloat(transaction.debitAmount) > 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                        data-testid={`text-preview-debit-${index}`}
                      >
                        {parseFloat(transaction.debitAmount) > 0 ? formatCurrency(transaction.debitAmount) : '0.00'}
                      </TableCell>
                      <TableCell 
                        className={`text-right ${parseFloat(transaction.creditAmount) > 0 ? 'text-green-600' : 'text-muted-foreground'}`}
                        data-testid={`text-preview-credit-${index}`}
                      >
                        {parseFloat(transaction.creditAmount) > 0 ? formatCurrency(transaction.creditAmount) : '0.00'}
                      </TableCell>
                      <TableCell 
                        className={`text-right font-medium ${parseFloat(transaction.runningBalance || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        data-testid={`text-preview-running-balance-${index}`}
                      >
                        {formatCurrency(transaction.runningBalance || '0')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Page Footer */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground" data-testid="text-page-footer">Page 1 of 1</p>
        </div>
      </CardContent>
    </Card>
  );
}
