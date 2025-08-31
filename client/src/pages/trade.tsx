import { TradingHeader } from "@/components/trading/TradingHeader";
import { CommoditySidebar } from "@/components/trading/CommoditySidebar";
import { TradingChart } from "@/components/trading/TradingChart";
import { OrderBook } from "@/components/trading/OrderBook";
import { TradingPanel } from "@/components/trading/TradingPanel";
import { StatusBar } from "@/components/trading/StatusBar";
import { useQuery } from "@tanstack/react-query";
import { tradingApi } from "@/lib/trading";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState, useEffect } from "react";
import type { CommodityMarket, Price, PriceUpdate } from "@shared/schema";

export default function TradePage() {
  const [selectedMarket, setSelectedMarket] = useState<CommodityMarket | null>(null);
  const [currentPrice, setCurrentPrice] = useState<Price | null>(null);
  
  const { data: markets = [], isLoading: marketsLoading } = useQuery({
    queryKey: ["/api/markets"],
    queryFn: () => tradingApi.getMarkets(),
  });

  const { data: prices = [] } = useQuery({
    queryKey: ["/api/prices"],
    queryFn: () => tradingApi.getPrices(),
  });

  const { lastMessage } = useWebSocket("/ws");

  // Set default market to Gold Perpetual
  useEffect(() => {
    if (markets.length > 0 && !selectedMarket) {
      const goldMarket = markets.find(m => m.symbol === "XAU-PERP");
      if (goldMarket) {
        setSelectedMarket(goldMarket);
      }
    }
  }, [markets, selectedMarket]);

  // Update prices from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'price_update' && selectedMarket) {
      const priceUpdate = lastMessage as PriceUpdate;
      if (priceUpdate.marketId === selectedMarket.id) {
        const existingPrice = prices.find(p => p.marketId === selectedMarket.id);
        if (existingPrice) {
          setCurrentPrice({
            ...existingPrice,
            price: priceUpdate.price,
            change24h: priceUpdate.change24h,
            lastUpdated: new Date(priceUpdate.timestamp)
          });
        }
      }
    }
  }, [lastMessage, selectedMarket, prices]);

  // Set current price when market changes
  useEffect(() => {
    if (selectedMarket) {
      const price = prices.find(p => p.marketId === selectedMarket.id);
      if (price) {
        setCurrentPrice(price);
      }
    }
  }, [selectedMarket, prices]);

  if (marketsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading markets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TradingHeader 
        selectedMarket={selectedMarket}
        currentPrice={currentPrice}
      />
      
      <div className="flex h-[calc(100vh-80px)]">
        <CommoditySidebar 
          markets={markets}
          prices={prices}
          selectedMarket={selectedMarket}
          onMarketSelect={setSelectedMarket}
        />
        
        <main className="flex-1 flex flex-col">
          {selectedMarket && currentPrice && (
            <TradingChart 
              market={selectedMarket}
              price={currentPrice}
            />
          )}
          
          <div className="flex">
            <div className="flex-1">
              {/* Chart area is handled in TradingChart component */}
            </div>
            
            <div className="w-80 border-l border-border flex flex-col">
              {selectedMarket && (
                <OrderBook marketId={selectedMarket.id} />
              )}
            </div>
          </div>
        </main>
        
        {selectedMarket && (
          <TradingPanel 
            market={selectedMarket}
            currentPrice={currentPrice}
          />
        )}
      </div>
      
      <StatusBar />
    </div>
  );
}
