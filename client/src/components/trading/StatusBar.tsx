export function StatusBar() {
  return (
    <div className="bg-card border-t border-border px-6 py-2" data-testid="status-bar">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span data-testid="market-status">
            Market Status: <span className="text-accent">Open</span>
          </span>
          <span>|</span>
          <span data-testid="oracle-health">
            Oracle Health: <span className="text-accent">Good</span>
          </span>
          <span>|</span>
          <span data-testid="network-info">
            Network: <span className="text-accent">Solana</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span data-testid="last-update">
            Last Update: <span className="font-mono">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
          </span>
          <span>|</span>
          <span data-testid="gas-fee">
            Gas: <span className="text-primary">0.0001 SOL</span>
          </span>
        </div>
      </div>
    </div>
  );
}
