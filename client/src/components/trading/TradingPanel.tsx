import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tradingApi, calculateLiquidationPrice, calculateMargin, formatPrice, formatCurrency, formatPercent } from "@/lib/trading";
// import { liveTradingClient } from "@/lib/live-trading";
// import { useWallet } from "@/contexts/WalletContext";
import { useState, useEffect } from "react";
import type { CommodityMarket, Price, OrderType, OrderSide } from "@shared/schema";

interface TradingPanelProps {
  market: CommodityMarket;
  currentPrice: Price | null;
}

export function TradingPanel({ market, currentPrice }: TradingPanelProps) {
  const [orderSide, setOrderSide] = useState<OrderSide>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState([10]);
  const [isLiveTrading, setIsLiveTrading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const connected = false;
  const publicKey = null;
  const [solBalance, setSolBalance] = useState(0);

  // Demo mode - no live trading
  useEffect(() => {
    setIsLiveTrading(false);
    setSolBalance(0);
  }, []);

  const userId = "demo-user"; // For demo purposes

  const { data: positions = [] } = useQuery({
    queryKey: ["/api/positions", userId],
    queryFn: () => tradingApi.getUserPositions(userId),
  });

  const { data: portfolio } = useQuery({
    queryKey: ["/api/portfolio", userId],
    queryFn: () => tradingApi.getPortfolio(userId),
  });

  const placeOrderMutation = useMutation({
    mutationFn: tradingApi.placeOrder,
    onSuccess: () => {
      toast({
        title: "Order Placed",
        description: `${orderSide.toUpperCase()} order for ${size} ${market.symbol} placed successfully`,
      });
      setSize("");
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order",
        variant: "destructive"
      });
    }
  });

  const closePositionMutation = useMutation({
    mutationFn: tradingApi.closePosition,
    onSuccess: () => {
      toast({
        title: "Position Closed",
        description: "Position closed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: any) => {
      toast({
        title: "Close Failed", 
        description: error.message || "Failed to close position",
        variant: "destructive"
      });
    }
  });

  const currentPosition = positions.find(p => p.marketId === market.id);
  const marketPrice = currentPrice ? parseFloat(currentPrice.price) : 0;
  const sizeNum = parseFloat(size) || 0;
  const leverageNum = leverage[0];

  const estimatedMargin = sizeNum > 0 && marketPrice > 0 
    ? calculateMargin(sizeNum, marketPrice, leverageNum)
    : 0;

  const liquidationPrice = sizeNum > 0 && marketPrice > 0
    ? calculateLiquidationPrice(marketPrice, leverageNum, orderSide === "buy" ? "long" : "short")
    : 0;

  const handlePlaceOrder = async () => {
    if (!currentPrice || sizeNum <= 0) {
      toast({
        title: "Invalid Order",
        description: "Please enter a valid size",
        variant: "destructive"
      });
      return;
    }

    // Demo mode - use simulated trading
      placeOrderMutation.mutate({
        marketId: market.id,
        orderType,
        side: orderSide,
        size: size,
        userId,
        leverage: leverageNum,
        price: orderType === "market" ? undefined : currentPrice.price
      });
  };

  const handleClosePosition = () => {
    if (currentPosition) {
      closePositionMutation.mutate(currentPosition.id);
    }
  };

  return (
    <aside className="w-80 bg-card border-l border-border flex flex-col" data-testid="trading-panel">
      {/* Trading Form */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2 mb-4">
          <Button
            variant={orderSide === "buy" ? "default" : "ghost"}
            onClick={() => setOrderSide("buy")}
            className={`flex-1 ${orderSide === "buy" ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            data-testid="button-long"
          >
            Long
          </Button>
          <Button
            variant={orderSide === "sell" ? "default" : "ghost"}
            onClick={() => setOrderSide("sell")}
            className={`flex-1 ${orderSide === "sell" ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            data-testid="button-short"
          >
            Short
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2">Order Type</Label>
            <Select value={orderType} onValueChange={(value) => setOrderType(value as OrderType)}>
              <SelectTrigger className="w-full bg-input border-border" data-testid="select-order-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="limit">Limit</SelectItem>
                <SelectItem value="stop">Stop</SelectItem>
                <SelectItem value="stop_limit">Stop Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2">Size (USD)</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="bg-input border-border font-mono pr-12"
                data-testid="input-size"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-primary hover:text-primary/80"
                onClick={() => {
                  if (portfolio) {
                    setSize(portfolio.availableBalance);
                  }
                }}
                data-testid="button-max"
              >
                MAX
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2">Leverage</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={leverage}
                onValueChange={setLeverage}
                max={parseInt(market.maxLeverage.toString())}
                min={1}
                step={1}
                className="flex-1"
                data-testid="slider-leverage"
              />
              <span className="text-sm font-mono w-12 text-right text-foreground" data-testid="leverage-value">
                {leverage[0]}x
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Est. Margin:</span>
              <span className="float-right font-mono text-foreground" data-testid="estimated-margin">
                {formatCurrency(estimatedMargin)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Liquidation:</span>
              <span className="float-right font-mono text-destructive" data-testid="liquidation-price">
                {formatCurrency(liquidationPrice)}
              </span>
            </div>
          </div>

          {/* Live Trading Status */}
          <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
            <span className="text-xs text-muted-foreground">Trading Mode:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isLiveTrading ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className={`text-xs font-medium ${isLiveTrading ? 'text-green-600' : 'text-yellow-600'}`}>
                {isLiveTrading ? 'Live (Solana)' : 'Demo'}
              </span>
            </div>
          </div>

          {/* SOL Balance (when live trading) */}
          {isLiveTrading && (
            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <span className="text-xs text-muted-foreground">SOL Balance:</span>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                {solBalance.toFixed(4)} SOL
              </span>
            </div>
          )}

          <Button
            onClick={handlePlaceOrder}
            disabled={placeOrderMutation.isPending || !size || !currentPrice}
            className={`w-full py-3 font-semibold transition-colors ${
              orderSide === "buy" 
                ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            }`}
            data-testid="button-place-order"
          >
            {placeOrderMutation.isPending 
              ? "Placing..." 
              : `${orderSide === "buy" ? "Long" : "Short"} ${market.symbol}`}
          </Button>
        </div>
      </div>

      {/* Current Position */}
      {currentPosition && (
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold mb-3 text-foreground" data-testid="position-title">Current Position</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className={`font-mono ${currentPosition.side === 'long' ? 'text-accent' : 'text-destructive'}`} data-testid="position-size">
                {currentPosition.side === 'long' ? '+' : '-'}{currentPosition.size} {market.commodityType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entry Price:</span>
              <span className="font-mono text-foreground" data-testid="position-entry-price">
                {formatCurrency(parseFloat(currentPosition.entryPrice))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mark Price:</span>
              <span className="font-mono text-foreground" data-testid="position-mark-price">
                {formatCurrency(parseFloat(currentPosition.markPrice))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PnL:</span>
              <span className={`font-mono ${parseFloat(currentPosition.unrealizedPnl) >= 0 ? 'trading-green' : 'trading-red'}`} data-testid="position-pnl">
                {formatCurrency(parseFloat(currentPosition.unrealizedPnl))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margin:</span>
              <span className="font-mono text-foreground" data-testid="position-margin">
                {formatCurrency(parseFloat(currentPosition.margin))}
              </span>
            </div>
            <Button
              onClick={handleClosePosition}
              disabled={closePositionMutation.isPending}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-close-position"
            >
              {closePositionMutation.isPending ? "Closing..." : "Close Position"}
            </Button>
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="p-4 flex-1">
        <h3 className="font-semibold mb-3 text-foreground" data-testid="portfolio-title">Portfolio</h3>
        {portfolio ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Value:</span>
              <span className="font-mono text-foreground" data-testid="portfolio-total-value">
                {formatCurrency(parseFloat(portfolio.totalValue))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-mono text-foreground" data-testid="portfolio-available">
                {formatCurrency(parseFloat(portfolio.availableBalance))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Used Margin:</span>
              <span className="font-mono text-foreground" data-testid="portfolio-used-margin">
                {formatCurrency(parseFloat(portfolio.usedMargin))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total PnL:</span>
              <span className={`font-mono ${parseFloat(portfolio.totalPnl) >= 0 ? 'trading-green' : 'trading-red'}`} data-testid="portfolio-total-pnl">
                {formatCurrency(parseFloat(portfolio.totalPnl))}
              </span>
            </div>
            
            {/* Risk Meter */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Risk Level</span>
                <span className="text-accent capitalize" data-testid="risk-level">{portfolio.riskLevel}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-accent to-primary h-2 rounded-full transition-all" 
                  style={{ width: portfolio.riskLevel === 'low' ? '25%' : portfolio.riskLevel === 'medium' ? '50%' : '75%' }}
                  data-testid="risk-meter"
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm" data-testid="portfolio-loading">Loading portfolio...</div>
        )}
      </div>
    </aside>
  );
}
