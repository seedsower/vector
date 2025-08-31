import { useQuery } from "@tanstack/react-query";
import { tradingApi, formatPrice } from "@/lib/trading";
import { useEffect, useState } from "react";
import type { Trade } from "@shared/schema";

interface OrderBookProps {
  marketId: string;
}

// Mock order book data generator
const generateOrderBookData = (basePrice: number) => {
  const asks = [];
  const bids = [];
  
  // Generate asks (sell orders) - prices above current
  for (let i = 1; i <= 10; i++) {
    const price = basePrice * (1 + (i * 0.001));
    const size = Math.random() * 50 + 5;
    const total = price * size;
    asks.push({ price, size, total });
  }
  
  // Generate bids (buy orders) - prices below current  
  for (let i = 1; i <= 10; i++) {
    const price = basePrice * (1 - (i * 0.001));
    const size = Math.random() * 50 + 5;
    const total = price * size;
    bids.push({ price, size, total });
  }
  
  return { asks: asks.reverse(), bids };
};

export function OrderBook({ marketId }: OrderBookProps) {
  const [orderBook, setOrderBook] = useState<{ asks: any[], bids: any[] }>({ asks: [], bids: [] });
  
  const { data: trades = [] } = useQuery({
    queryKey: ["/api/trades", marketId],
    queryFn: () => tradingApi.getRecentTrades(marketId, 20),
    refetchInterval: 5000
  });

  const { data: prices = [] } = useQuery({
    queryKey: ["/api/prices"],
    queryFn: () => tradingApi.getPrices(),
  });

  useEffect(() => {
    const currentPrice = prices.find(p => p.marketId === marketId);
    if (currentPrice) {
      const basePrice = parseFloat(currentPrice.price);
      setOrderBook(generateOrderBookData(basePrice));
    }
  }, [marketId, prices]);

  // Generate some mock recent trades if none exist
  const mockTrades: Trade[] = trades.length > 0 ? trades : [
    {
      id: "1",
      marketId,
      price: "2048.65",
      size: "2.5",
      side: "buy",
      timestamp: new Date(Date.now() - 3000)
    },
    {
      id: "2", 
      marketId,
      price: "2048.40",
      size: "1.8",
      side: "buy",
      timestamp: new Date(Date.now() - 6000)
    },
    {
      id: "3",
      marketId,
      price: "2048.20", 
      size: "3.2",
      side: "sell",
      timestamp: new Date(Date.now() - 9000)
    },
    {
      id: "4",
      marketId,
      price: "2048.65",
      size: "0.9", 
      side: "buy",
      timestamp: new Date(Date.now() - 12000)
    },
    {
      id: "5",
      marketId,
      price: "2048.15",
      size: "4.1",
      side: "sell", 
      timestamp: new Date(Date.now() - 15000)
    }
  ];

  const currentPrice = prices.find(p => p.marketId === marketId);
  const spread = orderBook.asks.length > 0 && orderBook.bids.length > 0 
    ? orderBook.asks[0].price - orderBook.bids[0].price 
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Order Book */}
      <div className="h-1/2 p-4 border-b border-border">
        <h3 className="font-semibold mb-3 text-foreground" data-testid="orderbook-title">Order Book</h3>
        <div className="space-y-1 text-xs font-mono">
          <div className="grid grid-cols-3 text-muted-foreground mb-2">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>
          
          {/* Asks */}
          <div className="space-y-1" data-testid="orderbook-asks">
            {orderBook.asks.slice(0, 5).map((ask, index) => (
              <div 
                key={index} 
                className="grid grid-cols-3 py-1 hover:bg-destructive/10 trading-red cursor-pointer"
                data-testid={`ask-${index}`}
              >
                <span>{formatPrice(ask.price)}</span>
                <span className="text-right">{ask.size.toFixed(1)}</span>
                <span className="text-right">{formatPrice(ask.total, 0)}</span>
              </div>
            ))}
          </div>
          
          {/* Spread */}
          <div className="py-2 text-center text-primary font-semibold border-y border-border" data-testid="orderbook-spread">
            {currentPrice ? `$${formatPrice(currentPrice.price)} ↑ $${formatPrice(spread)}` : 'Loading...'}
          </div>
          
          {/* Bids */}
          <div className="space-y-1" data-testid="orderbook-bids">
            {orderBook.bids.slice(0, 5).map((bid, index) => (
              <div 
                key={index} 
                className="grid grid-cols-3 py-1 hover:bg-accent/10 trading-green cursor-pointer"
                data-testid={`bid-${index}`}
              >
                <span>{formatPrice(bid.price)}</span>
                <span className="text-right">{bid.size.toFixed(1)}</span>
                <span className="text-right">{formatPrice(bid.total, 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="h-1/2 p-4">
        <h3 className="font-semibold mb-3 text-foreground" data-testid="trades-title">Recent Trades</h3>
        <div className="space-y-1 text-xs font-mono">
          <div className="grid grid-cols-3 text-muted-foreground mb-2">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>
          <div className="space-y-1" data-testid="recent-trades">
            {mockTrades.map((trade, index) => (
              <div 
                key={trade.id} 
                className={`grid grid-cols-3 py-1 ${trade.side === 'buy' ? 'trading-green' : 'trading-red'}`}
                data-testid={`trade-${index}`}
              >
                <span>{formatPrice(trade.price)}</span>
                <span className="text-right">{trade.size}</span>
                <span className="text-right">
                  {trade.timestamp.toLocaleTimeString('en-US', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
