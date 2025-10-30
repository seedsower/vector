import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PriceTickerProps {
  price: string | number;
  previousPrice?: string | number;
  change?: string | number;
  className?: string;
  showChange?: boolean;
  animate?: boolean;
}

export function PriceTicker({
  price,
  previousPrice,
  change,
  className,
  showChange = false,
  animate = true,
}: PriceTickerProps) {
  const [flashColor, setFlashColor] = useState<"up" | "down" | null>(null);

  const currentPrice = typeof price === "string" ? parseFloat(price) : price;
  const prevPrice = typeof previousPrice === "string" ? parseFloat(previousPrice) : previousPrice;
  const priceChange = typeof change === "string" ? parseFloat(change) : change;

  useEffect(() => {
    if (animate && prevPrice && currentPrice !== prevPrice) {
      setFlashColor(currentPrice > prevPrice ? "up" : "down");
      const timer = setTimeout(() => setFlashColor(null), 500);
      return () => clearTimeout(timer);
    }
  }, [currentPrice, prevPrice, animate]);

  const isPositive = priceChange !== undefined ? priceChange >= 0 : currentPrice > (prevPrice || currentPrice);

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span
        className={cn(
          "font-mono font-medium transition-all duration-300",
          flashColor === "up" && "text-green-400",
          flashColor === "down" && "text-red-400",
          !flashColor && "text-foreground"
        )}
      >
        ${currentPrice.toFixed(2)}
      </span>

      {showChange && priceChange !== undefined && (
        <span
          className={cn(
            "text-sm font-mono",
            isPositive ? "text-green-500" : "text-red-500"
          )}
        >
          {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

export function formatCurrency(amount: string | number, decimals: number = 2): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function formatVolume(volume: string | number): string {
  const num = typeof volume === "string" ? parseFloat(volume) : volume;

  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(1)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(1)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(1)}K`;
  }

  return `$${num.toFixed(0)}`;
}

interface LiveIndicatorProps {
  isLive?: boolean;
  className?: string;
}

export function LiveIndicator({ isLive = true, className }: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isLive ? "bg-green-500 animate-pulse" : "bg-gray-500"
        )}
      />
      <span className="text-xs text-muted-foreground">
        {isLive ? "LIVE" : "DELAYED"}
      </span>
    </div>
  );
}