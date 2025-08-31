import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradingHeader } from "@/components/trading/TradingHeader";
import { CommodityCategory, type CommodityMarket, type Price } from "@shared/schema";

interface MarketRowProps {
  market: CommodityMarket;
  price: Price | null;
  onTradeClick: (market: CommodityMarket) => void;
}

function MarketRow({ market, price, onTradeClick }: MarketRowProps) {
  const change = price ? parseFloat(price.change24h) : 0;
  const isPositive = change >= 0;

  return (
    <div className="grid grid-cols-8 gap-4 p-4 hover:bg-card/50 border-b border-border/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-8 rounded-sm ${
          market.category === CommodityCategory.PRECIOUS_METALS ? 'commodity-precious' :
          market.category === CommodityCategory.ENERGY ? 'commodity-energy' :
          market.category === CommodityCategory.AGRICULTURE ? 'commodity-agriculture' :
          'commodity-industrial'
        }`}></div>
        <div>
          <div className="font-medium text-foreground">{market.symbol}</div>
          <div className="text-sm text-muted-foreground">{market.name}</div>
        </div>
      </div>
      
      <div className="flex items-center">
        <span className="font-mono text-foreground">
          ${price ? parseFloat(price.price).toFixed(2) : '--'}
        </span>
      </div>
      
      <div className="flex items-center">
        <span className={`font-mono ${isPositive ? 'trading-green' : 'trading-red'}`}>
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
      
      <div className="flex items-center">
        <span className="font-mono text-muted-foreground">
          ${price ? parseFloat(price.volume24h).toLocaleString() : '--'}
        </span>
      </div>
      
      <div className="flex items-center">
        <span className="font-mono text-muted-foreground">
          ${price ? parseFloat(price.openInterest).toLocaleString() : '--'}
        </span>
      </div>
      
      <div className="flex items-center">
        <Badge variant={market.isActive ? "default" : "secondary"} className="text-xs">
          {market.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground">
          {market.maxLeverage}x
        </span>
      </div>
      
      <div className="flex items-center justify-end space-x-2">
        <Button 
          size="sm" 
          variant="outline"
          className="hover:vector-primary hover:border-primary"
          onClick={() => onTradeClick(market)}
        >
          Trade
        </Button>
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState<CommodityCategory | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"symbol" | "price" | "change" | "volume">("symbol");

  const { data: markets = [] } = useQuery({
    queryKey: ["/api/markets"],
  });

  const { data: prices = [] } = useQuery({
    queryKey: ["/api/prices"],
  });

  const priceMap = useMemo(() => {
    const map = new Map<string, Price>();
    prices.forEach(price => map.set(price.marketId, price));
    return map;
  }, [prices]);

  const filteredMarkets = useMemo(() => {
    let filtered = markets;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(market => market.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(market => 
        market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort markets
    filtered.sort((a, b) => {
      const priceA = priceMap.get(a.id);
      const priceB = priceMap.get(b.id);

      switch (sortBy) {
        case "price":
          const priceValA = priceA ? parseFloat(priceA.price) : 0;
          const priceValB = priceB ? parseFloat(priceB.price) : 0;
          return priceValB - priceValA;
        case "change":
          const changeA = priceA ? parseFloat(priceA.change24h) : 0;
          const changeB = priceB ? parseFloat(priceB.change24h) : 0;
          return changeB - changeA;
        case "volume":
          const volumeA = priceA ? parseFloat(priceA.volume24h) : 0;
          const volumeB = priceB ? parseFloat(priceB.volume24h) : 0;
          return volumeB - volumeA;
        default:
          return a.symbol.localeCompare(b.symbol);
      }
    });

    return filtered;
  }, [markets, selectedCategory, searchTerm, sortBy, priceMap]);

  const handleTradeClick = (market: CommodityMarket) => {
    window.location.href = `/trade?market=${market.id}`;
  };

  const getCategoryStats = (category: CommodityCategory) => {
    const categoryMarkets = markets.filter(m => m.category === category);
    const categoryPrices = categoryMarkets.map(m => priceMap.get(m.id)).filter(Boolean);
    
    const totalVolume = categoryPrices.reduce((sum, price) => 
      sum + (price ? parseFloat(price.volume24h) : 0), 0
    );
    
    const avgChange = categoryPrices.length > 0 
      ? categoryPrices.reduce((sum, price) => sum + parseFloat(price.change24h), 0) / categoryPrices.length 
      : 0;

    return {
      count: categoryMarkets.length,
      volume: totalVolume,
      change: avgChange
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <TradingHeader selectedMarket={null} currentPrice={null} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold vector-primary mb-2">Commodity Markets</h1>
          <p className="text-muted-foreground">
            Trade 40+ tokenized commodities across precious metals, energy, agriculture, and industrial metals
          </p>
        </div>

        {/* Category Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.values(CommodityCategory).map(category => {
            const stats = getCategoryStats(category);
            const isPositive = stats.change >= 0;
            
            return (
              <Card key={category} className="bg-card/50 border-primary/20 hover:bg-card/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedCategory(category)}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg capitalize">
                    {category.replace('_', ' ').toLowerCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Markets:</span>
                      <span className="font-medium">{stats.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">24h Volume:</span>
                      <span className="font-mono text-sm">${stats.volume.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Change:</span>
                      <span className={`font-mono text-sm ${isPositive ? 'trading-green' : 'trading-red'}`}>
                        {isPositive ? '+' : ''}{stats.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 bg-card/50 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search markets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background border-primary/20 focus:border-primary"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48 bg-background border-primary/20">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value={CommodityCategory.PRECIOUS_METALS}>Precious Metals</SelectItem>
                  <SelectItem value={CommodityCategory.ENERGY}>Energy</SelectItem>
                  <SelectItem value={CommodityCategory.AGRICULTURE}>Agriculture</SelectItem>
                  <SelectItem value={CommodityCategory.INDUSTRIAL_METALS}>Industrial Metals</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-36 bg-background border-primary/20">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="symbol">Symbol</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="change">Change</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Markets Table */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Markets ({filteredMarkets.length})</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs vector-primary border-primary/30">
                  Live Prices
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-8 gap-4 p-4 border-b border-border font-medium text-muted-foreground text-sm">
              <div>Market</div>
              <div>Price</div>
              <div>24h Change</div>
              <div>24h Volume</div>
              <div>Open Interest</div>
              <div>Status</div>
              <div>Max Leverage</div>
              <div className="text-right">Action</div>
            </div>
            
            {/* Table Body */}
            {filteredMarkets.length > 0 ? (
              filteredMarkets.map(market => (
                <MarketRow
                  key={market.id}
                  market={market}
                  price={priceMap.get(market.id) || null}
                  onTradeClick={handleTradeClick}
                />
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No markets found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}