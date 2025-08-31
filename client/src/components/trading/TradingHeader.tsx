import { Button } from "@/components/ui/button";
import { formatPrice, formatPercent } from "@/lib/trading";
import { ChartLine } from "lucide-react";
import type { CommodityMarket, Price } from "@shared/schema";

interface TradingHeaderProps {
  selectedMarket: CommodityMarket | null;
  currentPrice: Price | null;
}

export function TradingHeader({ selectedMarket, currentPrice }: TradingHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="trading-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <i className="fas fa-vector-square text-primary-foreground text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-foreground" data-testid="app-title">Vector Protocol</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-primary font-medium" data-testid="nav-trade">Trade</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-markets">Markets</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-portfolio">Portfolio</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-analytics">Analytics</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-earn">Earn</a>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span className="text-muted-foreground" data-testid="network-status">Solana Mainnet</span>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-connect-wallet">
            Connect Wallet
          </Button>
        </div>
      </div>

      {selectedMarket && currentPrice && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-foreground" data-testid="market-title">
                {selectedMarket.name} ({selectedMarket.symbol})
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded" data-testid="market-timeframe">24h</span>
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded" data-testid="market-volume-indicator">HIGH VOLUME</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className={`text-2xl font-bold font-mono ${parseFloat(currentPrice.change24h) >= 0 ? 'trading-green' : 'trading-red'}`} data-testid="current-price">
                  ${formatPrice(currentPrice.price)}
                </div>
                <div className={`text-sm ${parseFloat(currentPrice.change24h) >= 0 ? 'trading-green' : 'trading-red'}`} data-testid="price-change">
                  {formatPercent(currentPrice.change24h)}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="hover:bg-muted" data-testid="button-chart-settings">
                <ChartLine className="text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">24h Change</div>
              <div className={`font-mono ${parseFloat(currentPrice.change24h) >= 0 ? 'trading-green' : 'trading-red'}`} data-testid="stat-24h-change">
                {formatPercent(currentPrice.change24h)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">24h Volume</div>
              <div className="font-mono text-foreground" data-testid="stat-24h-volume">
                ${formatPrice(currentPrice.volume24h, 1)}M
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Open Interest</div>
              <div className="font-mono text-foreground" data-testid="stat-open-interest">
                ${formatPrice(currentPrice.openInterest, 1)}M
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Funding Rate</div>
              <div className="font-mono text-foreground" data-testid="stat-funding-rate">
                {currentPrice.fundingRate}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Next Funding</div>
              <div className="font-mono text-foreground" data-testid="stat-next-funding">
                02:45:32
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Index Price</div>
              <div className="font-mono text-foreground" data-testid="stat-index-price">
                ${formatPrice(currentPrice.indexPrice)}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
