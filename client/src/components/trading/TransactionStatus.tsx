import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Transaction {
  id: string;
  type: "trade" | "deposit" | "withdrawal" | "stake" | "unstake";
  status: "pending" | "confirming" | "confirmed" | "failed";
  hash?: string;
  amount: string;
  token: string;
  timestamp: Date;
  confirmations?: number;
  requiredConfirmations?: number;
  gasPrice?: string;
  gasFee?: string;
}

interface TransactionStatusProps {
  transaction: Transaction;
  onRetry?: () => void;
  onViewExplorer?: (hash: string) => void;
}

export function TransactionStatus({
  transaction,
  onRetry,
  onViewExplorer,
}: TransactionStatusProps) {
  const getStatusIcon = () => {
    switch (transaction.status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case "confirming":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case "pending":
        return "border-yellow-500 bg-yellow-50/10";
      case "confirming":
        return "border-blue-500 bg-blue-50/10";
      case "confirmed":
        return "border-green-500 bg-green-50/10";
      case "failed":
        return "border-red-500 bg-red-50/10";
      default:
        return "border-gray-500 bg-gray-50/10";
    }
  };

  const getProgressValue = () => {
    if (transaction.status === "confirmed") return 100;
    if (transaction.status === "failed") return 0;
    if (transaction.confirmations && transaction.requiredConfirmations) {
      return (transaction.confirmations / transaction.requiredConfirmations) * 100;
    }
    return transaction.status === "confirming" ? 66 : 33;
  };

  return (
    <Card className={cn("border-l-4", getStatusColor())}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <span className="capitalize">{transaction.type}</span>
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 text-xs",
                  transaction.status === "confirmed" && "border-green-500 text-green-500",
                  transaction.status === "failed" && "border-red-500 text-red-500",
                  transaction.status === "pending" && "border-yellow-500 text-yellow-500",
                  transaction.status === "confirming" && "border-blue-500 text-blue-500"
                )}
              >
                {transaction.status.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {transaction.timestamp.toLocaleTimeString()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Amount:</span>
            <div className="font-mono font-medium">
              {transaction.amount} {transaction.token}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Transaction ID:</span>
            <div className="font-mono text-xs truncate">
              {transaction.hash ? `${transaction.hash.slice(0, 8)}...${transaction.hash.slice(-8)}` : "Pending"}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {(transaction.status === "pending" || transaction.status === "confirming") && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              {transaction.confirmations && transaction.requiredConfirmations && (
                <span className="text-muted-foreground">
                  {transaction.confirmations}/{transaction.requiredConfirmations} confirmations
                </span>
              )}
            </div>
            <Progress value={getProgressValue()} className="h-2" />
          </div>
        )}

        {/* Gas Information */}
        {transaction.gasFee && (
          <div className="text-sm">
            <span className="text-muted-foreground">Gas Fee:</span>
            <span className="ml-2 font-mono">{transaction.gasFee} SOL</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {transaction.hash && onViewExplorer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewExplorer(transaction.hash!)}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="h-3 w-3" />
              <span>View on Explorer</span>
            </Button>
          )}

          {transaction.status === "failed" && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center space-x-1"
            >
              <span>Retry</span>
            </Button>
          )}
        </div>

        {/* Status Messages */}
        {transaction.status === "pending" && (
          <div className="text-sm text-yellow-600 bg-yellow-50/10 p-2 rounded-lg">
            Transaction submitted to the network. Waiting for confirmation...
          </div>
        )}

        {transaction.status === "confirming" && (
          <div className="text-sm text-blue-600 bg-blue-50/10 p-2 rounded-lg">
            Transaction is being confirmed on the blockchain...
          </div>
        )}

        {transaction.status === "confirmed" && (
          <div className="text-sm text-green-600 bg-green-50/10 p-2 rounded-lg">
            ✅ Transaction confirmed successfully!
          </div>
        )}

        {transaction.status === "failed" && (
          <div className="text-sm text-red-600 bg-red-50/10 p-2 rounded-lg">
            ❌ Transaction failed. Please try again or contact support.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TransactionListProps {
  transactions: Transaction[];
  onRetry?: (transaction: Transaction) => void;
  onViewExplorer?: (hash: string) => void;
  maxItems?: number;
}

export function TransactionList({
  transactions,
  onRetry,
  onViewExplorer,
  maxItems = 5,
}: TransactionListProps) {
  const sortedTransactions = transactions
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxItems);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-muted-foreground">
            No recent transactions
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTransactions.map((transaction) => (
        <TransactionStatus
          key={transaction.id}
          transaction={transaction}
          onRetry={onRetry ? () => onRetry(transaction) : undefined}
          onViewExplorer={onViewExplorer}
        />
      ))}
    </div>
  );
}