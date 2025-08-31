import { TradingViewChart } from "./TradingViewChart";
import type { CommodityMarket, Price } from "@shared/schema";

interface TradingChartProps {
  market: CommodityMarket | null;
  price: Price | null;
}

export function TradingChart({ market, price }: TradingChartProps) {
  return (
    <div className="flex-1 border-r border-border">
      <TradingViewChart market={market} price={price} />
    </div>
  );
}
