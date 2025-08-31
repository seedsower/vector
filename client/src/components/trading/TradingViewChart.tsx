import { useEffect, useRef } from "react";
import type { CommodityMarket, Price } from "@shared/schema";

interface TradingViewChartProps {
  market: CommodityMarket | null;
  price: Price | null;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingViewChart({ market, price }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !market) return;

    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => initializeChart();
      document.head.appendChild(script);
    } else {
      initializeChart();
    }

    function initializeChart() {
      if (!containerRef.current || !window.TradingView) return;

      // Clear existing widget
      if (widgetRef.current) {
        widgetRef.current.remove();
      }

      // Map commodity symbols to TradingView symbols
      const symbolMapping: { [key: string]: string } = {
        'XAU-PERP': 'COMEX:GC1!',      // Gold
        'XAG-PERP': 'COMEX:SI1!',      // Silver
        'XPT-PERP': 'NYMEX:PL1!',      // Platinum
        'XPD-PERP': 'NYMEX:PA1!',      // Palladium
        'CL-PERP': 'NYMEX:CL1!',       // Crude Oil WTI
        'BZ-PERP': 'ICE:B1!',          // Brent Crude
        'NG-PERP': 'NYMEX:NG1!',       // Natural Gas
        'ZC-PERP': 'CBOT:ZC1!',        // Corn
        'ZW-PERP': 'CBOT:ZW1!',        // Wheat
        'ZS-PERP': 'CBOT:ZS1!',        // Soybeans
        'SB-PERP': 'ICE:SB1!',         // Sugar
        'KC-PERP': 'ICE:KC1!',         // Coffee
        'CC-PERP': 'ICE:CC1!',         // Cocoa
        'CT-PERP': 'ICE:CT1!',         // Cotton
        'HG-PERP': 'COMEX:HG1!',       // Copper
        'ALI-PERP': 'LME:ALI1!',       // Aluminum
        'ZN-PERP': 'LME:ZN1!',         // Zinc
        'NI-PERP': 'LME:NI1!',         // Nickel
      };

      const tradingViewSymbol = symbolMapping[market.symbol] || 'COMEX:GC1!';

      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: tradingViewSymbol,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#1a1a1a",
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: containerRef.current.id,
        studies: [
          "Volume@tv-basicstudies",
          "RSI@tv-basicstudies",
          "MACD@tv-basicstudies"
        ],
        overrides: {
          "paneProperties.background": "#0a0a0a",
          "paneProperties.vertGridProperties.color": "#1e1e1e",
          "paneProperties.horzGridProperties.color": "#1e1e1e",
          "symbolWatermarkProperties.transparency": 90,
          "scalesProperties.textColor": "#AAA",
          "mainSeriesProperties.candleStyle.upColor": "#00D4FF",
          "mainSeriesProperties.candleStyle.downColor": "#FF6B00",
          "mainSeriesProperties.candleStyle.borderUpColor": "#00D4FF",
          "mainSeriesProperties.candleStyle.borderDownColor": "#FF6B00",
          "mainSeriesProperties.candleStyle.wickUpColor": "#00D4FF",
          "mainSeriesProperties.candleStyle.wickDownColor": "#FF6B00",
        },
        disabled_features: [
          "use_localstorage_for_settings",
          "volume_force_overlay",
          "create_volume_indicator_by_default"
        ],
        enabled_features: [
          "study_templates"
        ],
        loading_screen: {
          backgroundColor: "#0a0a0a",
          foregroundColor: "#00D4FF"
        }
      });
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
      }
    };
  }, [market]);

  if (!market) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-lg">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Select a commodity to view chart</div>
          <div className="text-xs text-muted-foreground">
            Professional TradingView charts with technical analysis
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-foreground">{market.name}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">
              {market.category}
            </span>
            {price && (
              <span className={`text-xs px-2 py-1 rounded ${
                parseFloat(price.change24h) >= 0 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {parseFloat(price.change24h) >= 0 ? '+' : ''}{price.change24h}%
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Powered by TradingView
        </div>
      </div>
      <div 
        id={`tradingview_${market.id}`}
        ref={containerRef}
        className="h-[600px] w-full"
      />
    </div>
  );
}