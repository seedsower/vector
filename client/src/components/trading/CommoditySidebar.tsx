import { Button } from "@/components/ui/button";
import { formatPrice, formatPercent } from "@/lib/trading";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CommodityMarket, Price } from "@shared/schema";

interface CommoditySidebarProps {
  markets: CommodityMarket[];
  prices: Price[];
  selectedMarket: CommodityMarket | null;
  onMarketSelect: (market: CommodityMarket) => void;
}

const categoryIcons = {
  precious_metals: "fas fa-coins",
  energy: "fas fa-fire", 
  agriculture: "fas fa-seedling",
  industrial_metals: "fas fa-industry"
};

const categoryColors = {
  precious_metals: "text-secondary",
  energy: "text-destructive",
  agriculture: "text-accent",
  industrial_metals: "text-chart-4"
};

const categoryNames = {
  precious_metals: "Precious Metals",
  energy: "Energy",
  agriculture: "Agriculture", 
  industrial_metals: "Industrial Metals"
};

export function CommoditySidebar({ markets, prices, selectedMarket, onMarketSelect }: CommoditySidebarProps) {
  const [expandedCategory, setExpandedCategory] = useState("precious_metals");

  const categorizedMarkets = markets.reduce((acc, market) => {
    if (!acc[market.category]) {
      acc[market.category] = [];
    }
    acc[market.category].push(market);
    return acc;
  }, {} as Record<string, CommodityMarket[]>);

  const getMarketPrice = (marketId: string) => {
    return prices.find(p => p.marketId === marketId);
  };

  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col" data-testid="commodity-sidebar">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground mb-3" data-testid="sidebar-title">Commodity Markets</h2>
        <div className="space-y-2">
          {Object.entries(categorizedMarkets).map(([category, categoryMarkets]) => (
            <div key={category}>
              <Button
                variant="ghost"
                onClick={() => setExpandedCategory(expandedCategory === category ? "" : category)}
                className={`w-full justify-between ${
                  expandedCategory === category 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                data-testid={`category-button-${category}`}
              >
                <span className="flex items-center space-x-2">
                  <i className={`${categoryIcons[category as keyof typeof categoryIcons]} ${categoryColors[category as keyof typeof categoryColors]}`}></i>
                  <span>{categoryNames[category as keyof typeof categoryNames]}</span>
                </span>
                {expandedCategory === category ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              
              {expandedCategory === category && (
                <div className="mt-2 ml-4 space-y-1">
                  {categoryMarkets.map((market) => {
                    const price = getMarketPrice(market.id);
                    const isSelected = selectedMarket?.id === market.id;
                    
                    return (
                      <div
                        key={market.id}
                        onClick={() => onMarketSelect(market)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border border-accent/20 bg-accent/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        data-testid={`market-item-${market.symbol}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground">{market.name}</span>
                          <span className={`text-xs ${isSelected ? 'text-accent' : 'text-muted-foreground'}`}>
                            {market.marketType.toUpperCase()}
                          </span>
                        </div>
                        {price && (
                          <div className="flex items-center justify-between text-sm">
                            <span className={`font-mono ${parseFloat(price.change24h) >= 0 ? 'trading-green' : 'trading-red'}`} data-testid={`price-${market.symbol}`}>
                              ${formatPrice(price.price)}
                            </span>
                            <span className={parseFloat(price.change24h) >= 0 ? 'trading-green' : 'trading-red'} data-testid={`change-${market.symbol}`}>
                              {formatPercent(price.change24h)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
