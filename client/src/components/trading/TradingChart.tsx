import { Button } from "@/components/ui/button";
import { Expand, Settings } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CommodityMarket, Price } from "@shared/schema";

interface TradingChartProps {
  market: CommodityMarket;
  price: Price;
}

export function TradingChart({ market, price }: TradingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Generate sample candlestick data for visualization
  const generateChartData = () => {
    const basePrice = parseFloat(price.price);
    const points = [];
    
    for (let i = 0; i < 50; i++) {
      const change = (Math.random() - 0.5) * 0.02;
      const currentPrice = basePrice * (1 + change * (i + 1) / 50);
      const high = currentPrice * (1 + Math.random() * 0.01);
      const low = currentPrice * (1 - Math.random() * 0.01);
      const open = i === 0 ? basePrice : points[i - 1]?.close || currentPrice;
      
      points.push({
        x: 50 + i * 15,
        open,
        high,
        low, 
        close: currentPrice,
        volume: Math.random() * 1000
      });
    }
    
    return points;
  };

  const renderChart = () => {
    if (!chartRef.current) return;

    const canvas = chartRef.current.querySelector('canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = generateChartData();
    const maxPrice = Math.max(...data.map(d => d.high));
    const minPrice = Math.min(...data.map(d => d.low));
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = 'hsl(217, 15%, 20%)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= 10; i++) {
      const y = (canvas.height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    for (let i = 0; i <= 20; i++) {
      const x = (canvas.width / 20) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw candlesticks
    data.forEach((candle, index) => {
      const x = candle.x;
      const openY = canvas.height - ((candle.open - minPrice) / priceRange) * canvas.height;
      const closeY = canvas.height - ((candle.close - minPrice) / priceRange) * canvas.height;
      const highY = canvas.height - ((candle.high - minPrice) / priceRange) * canvas.height;
      const lowY = canvas.height - ((candle.low - minPrice) / priceRange) * canvas.height;

      const isBullish = candle.close > candle.open;
      const color = isBullish ? 'hsl(153, 100%, 55%)' : 'hsl(0, 100%, 60%)';

      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = color;
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      ctx.fillRect(x - 3, bodyY, 6, bodyHeight || 1);
    });

    // Draw price line
    ctx.strokeStyle = 'hsl(191, 100%, 50%)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((candle, index) => {
      const x = candle.x;
      const y = canvas.height - ((candle.close - minPrice) / priceRange) * canvas.height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };

  useEffect(() => {
    renderChart();
  }, [market, price]);

  return (
    <div className="p-6 border-b border-border">
      <div className="bg-card rounded-lg border border-border h-96 flex flex-col" data-testid="trading-chart">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="font-semibold" data-testid="chart-title">{market.symbol} Chart</h3>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="default" className="text-xs" data-testid="timeframe-1d">1D</Button>
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" data-testid="timeframe-1w">1W</Button>
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" data-testid="timeframe-1m">1M</Button>
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" data-testid="timeframe-3m">3M</Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="hover:bg-muted" data-testid="button-chart-expand">
              <Expand className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted" data-testid="button-chart-settings">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-4" ref={chartRef}>
          <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center relative overflow-hidden">
            <canvas 
              width={800} 
              height={300} 
              className="w-full h-full"
              data-testid="chart-canvas"
            />
            <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
              Real-time {market.name} Price Chart
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
