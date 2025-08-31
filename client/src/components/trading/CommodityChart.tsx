import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type CommodityMarket, type Price } from "@shared/schema";

interface CommodityChartProps {
  market: CommodityMarket;
  price: Price | null;
  height?: number;
}

interface TechnicalIndicator {
  name: string;
  signal: "bullish" | "bearish" | "neutral";
  strength: number;
}

interface PriceLevel {
  level: number;
  type: "support" | "resistance";
  strength: number;
}

export function CommodityChart({ market, price, height = 500 }: CommodityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("candlestick");
  const [isLoading, setIsLoading] = useState(true);

  // Mock technical analysis data
  const technicalIndicators: TechnicalIndicator[] = [
    { name: "RSI (14)", signal: "bullish", strength: 0.7 },
    { name: "MACD", signal: "bearish", strength: 0.4 },
    { name: "SMA (20)", signal: "bullish", strength: 0.8 },
    { name: "Bollinger Bands", signal: "neutral", strength: 0.5 },
    { name: "Stochastic", signal: "bullish", strength: 0.6 }
  ];

  const priceLevels: PriceLevel[] = [
    { level: parseFloat(price?.price || "0") * 1.05, type: "resistance", strength: 0.8 },
    { level: parseFloat(price?.price || "0") * 1.02, type: "resistance", strength: 0.6 },
    { level: parseFloat(price?.price || "0") * 0.98, type: "support", strength: 0.7 },
    { level: parseFloat(price?.price || "0") * 0.95, type: "support", strength: 0.9 }
  ];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Simulate TradingView widget initialization
    const initChart = () => {
      setIsLoading(true);
      
      // Create a mock candlestick chart using Canvas
      const container = chartContainerRef.current!;
      container.innerHTML = '';
      
      const canvas = document.createElement('canvas');
      canvas.width = container.offsetWidth;
      canvas.height = height;
      canvas.style.width = '100%';
      canvas.style.height = `${height}px`;
      canvas.style.backgroundColor = 'hsl(222.2, 84%, 4.9%)';
      
      const ctx = canvas.getContext('2d')!;
      
      // Generate mock price data
      const dataPoints = 100;
      const basePrice = parseFloat(price?.price || "100");
      let currentPrice = basePrice;
      const priceHistory = [];
      
      for (let i = 0; i < dataPoints; i++) {
        const change = (Math.random() - 0.5) * (basePrice * 0.02);
        currentPrice = Math.max(currentPrice + change, basePrice * 0.8);
        priceHistory.push({
          time: i,
          open: currentPrice,
          high: currentPrice * (1 + Math.random() * 0.01),
          low: currentPrice * (1 - Math.random() * 0.01),
          close: currentPrice + (Math.random() - 0.5) * (basePrice * 0.005),
          volume: Math.random() * 1000000
        });
      }
      
      // Draw chart background
      ctx.fillStyle = 'hsl(222.2, 84%, 4.9%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = 'hsl(217.2, 32.6%, 17.5%)';
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = (canvas.width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let i = 0; i <= 8; i++) {
        const y = (canvas.height / 8) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Calculate price range
      const prices = priceHistory.flatMap(d => [d.high, d.low]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      
      // Draw candlesticks
      const candleWidth = canvas.width / dataPoints * 0.6;
      
      priceHistory.forEach((data, i) => {
        const x = (canvas.width / dataPoints) * i + candleWidth / 2;
        const openY = canvas.height - ((data.open - minPrice) / priceRange) * canvas.height;
        const closeY = canvas.height - ((data.close - minPrice) / priceRange) * canvas.height;
        const highY = canvas.height - ((data.high - minPrice) / priceRange) * canvas.height;
        const lowY = canvas.height - ((data.low - minPrice) / priceRange) * canvas.height;
        
        const isGreen = data.close > data.open;
        
        // Draw wick
        ctx.strokeStyle = isGreen ? '#00FF88' : '#FF3366';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();
        
        // Draw body
        ctx.fillStyle = isGreen ? '#00FF88' : '#FF3366';
        const bodyHeight = Math.abs(closeY - openY);
        const bodyY = Math.min(openY, closeY);
        ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight || 1);
      });
      
      // Draw price levels
      priceLevels.forEach(level => {
        const y = canvas.height - ((level.level - minPrice) / priceRange) * canvas.height;
        ctx.strokeStyle = level.type === 'support' ? '#00D4FF' : '#FF6B00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw label
        ctx.fillStyle = level.type === 'support' ? '#00D4FF' : '#FF6B00';
        ctx.font = '12px monospace';
        ctx.fillText(`${level.type}: $${level.level.toFixed(2)}`, 10, y - 5);
      });
      
      container.appendChild(canvas);
      
      // Simulate loading delay
      setTimeout(() => setIsLoading(false), 1500);
    };

    initChart();

    // Cleanup
    return () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
      }
    };
  }, [market, timeframe, chartType, height, price]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "bullish": return "bg-accent text-black";
      case "bearish": return "bg-destructive text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Timeframe:</span>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-20 h-8 bg-background border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1m</SelectItem>
                    <SelectItem value="5m">5m</SelectItem>
                    <SelectItem value="15m">15m</SelectItem>
                    <SelectItem value="1H">1H</SelectItem>
                    <SelectItem value="4H">4H</SelectItem>
                    <SelectItem value="1D">1D</SelectItem>
                    <SelectItem value="1W">1W</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Type:</span>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger className="w-32 h-8 bg-background border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="candlestick">Candlestick</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="heikin-ashi">Heikin Ashi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" className="h-8">
                Indicators
              </Button>
              <Button size="sm" variant="outline" className="h-8">
                Studies
              </Button>
              <Button size="sm" variant="outline" className="h-8">
                Alerts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Chart */}
        <Card className="lg:col-span-3 bg-card/50 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {market.symbol} - {market.name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {timeframe}
                </Badge>
                <Badge 
                  variant={parseFloat(price?.change24h || "0") >= 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {parseFloat(price?.change24h || "0") >= 0 ? '+' : ''}{parseFloat(price?.change24h || "0").toFixed(2)}%
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              <div 
                ref={chartContainerRef}
                className="w-full bg-background/20 rounded-lg"
                style={{ height: `${height}px` }}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading chart data...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technical Analysis Sidebar */}
        <div className="space-y-4">
          {/* Price Levels */}
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Key Levels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {priceLevels.map((level, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className={`capitalize ${level.type === 'support' ? 'text-primary' : 'text-secondary'}`}>
                    {level.type}
                  </span>
                  <span className="font-mono">${level.level.toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Technical Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {technicalIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{indicator.name}</span>
                  <Badge className={`text-xs ${getSignalColor(indicator.signal)}`}>
                    {indicator.signal}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Market Summary */}
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Market Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">24h Volume:</span>
                <span className="font-mono">${parseFloat(price?.volume24h || "0").toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Open Interest:</span>
                <span className="font-mono">${parseFloat(price?.openInterest || "0").toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Funding Rate:</span>
                <span className="font-mono text-accent">0.0125%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next Funding:</span>
                <span className="font-mono">2h 15m</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}