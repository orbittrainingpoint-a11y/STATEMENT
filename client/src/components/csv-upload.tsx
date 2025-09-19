import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseCSV } from "@/lib/csv-parser";

interface CSVUploadProps {
  accountSetupId: string;
}

export default function CSVUpload({ accountSetupId }: CSVUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadTransactionsMutation = useMutation({
    mutationFn: async (transactions: any[]) => {
      const res = await apiRequest("POST", `/api/account-setups/${accountSetupId}/transactions/bulk`, {
        transactions,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-setups", accountSetupId, "transactions"] });
      toast({
        title: "Success",
        description: `Successfully imported ${data.length} transactions`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import transactions",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const csvText = await file.text();
      const transactions = parseCSV(csvText);
      
      if (transactions.length === 0) {
        toast({
          title: "Error",
          description: "No valid transactions found in the CSV file",
          variant: "destructive",
        });
        return;
      }

      uploadTransactionsMutation.mutate(transactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse CSV file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast, uploadTransactionsMutation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Upload className="text-primary mr-2 h-5 w-5" />
          Bulk Import from CSV
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="dropzone-csv-upload"
        >
          <FileText className="text-muted-foreground text-3xl mb-4 mx-auto" />
          <div className="space-y-2">
            <p className="text-sm text-foreground">
              Drop your CSV file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Expected format: Transaction Date, Value Date, Narration, Debit Amount, Credit Amount
            </p>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
            id="csv-file-input"
            data-testid="input-csv-file"
          />
          <Button
            onClick={() => document.getElementById('csv-file-input')?.click()}
            disabled={isProcessing || uploadTransactionsMutation.isPending}
            className="mt-4"
            variant="secondary"
            data-testid="button-select-csv"
          >
            {isProcessing || uploadTransactionsMutation.isPending ? 
              "Processing..." : 
              "Select CSV File"
            }
          </Button>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p className="font-medium mb-2">CSV Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>First row should contain headers (will be skipped)</li>
            <li>Date format: YYYY-MM-DD (e.g., 2022-05-27)</li>
            <li>Amounts should be numeric (e.g., 484.96 or 0.00)</li>
            <li>Either Debit or Credit amount should be greater than 0</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
