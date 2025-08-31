import { 
  CommodityType,
  CommodityCategory,
  type CommodityMarket, 
  type Position, 
  type Trade, 
  type Portfolio
} from "@shared/schema";
import { storage } from "./storage";

export interface AnalyticsData {
  overview: OverviewMetrics;
  commodities: CommodityMetrics[];
  volumes: VolumeMetrics;
  fees: FeeMetrics;
  riskMetrics: RiskMetrics;
}

export interface OverviewMetrics {
  totalVolume24h: string;
  totalTrades24h: number;
  activeMarkets: number;
  totalOpenInterest: string;
  averageSpread: string;
  platformTvl: string;
}

export interface CommodityMetrics {
  category: CommodityCategory;
  volume24h: string;
  changePercent: string;
  topPerformer: {
    symbol: string;
    change: string;
  };
  marketCount: number;
  averageVolatility: string;
}

export interface VolumeMetrics {
  hourly: Array<{ time: string; volume: string }>;
  daily: Array<{ date: string; volume: string }>;
  byCategory: Array<{ category: CommodityCategory; volume: string; percentage: number }>;
  topMarkets: Array<{ symbol: string; volume: string; change: string }>;
}

export interface FeeMetrics {
  totalFeesCollected: string;
  averageFeeRate: string;
  feesByCategory: Array<{ category: CommodityCategory; fees: string }>;
  rebatesPaid: string;
  netFeeRevenue: string;
}

export interface RiskMetrics {
  totalPositionsAtRisk: number;
  averageHealthFactor: string;
  liquidationBuffer: string;
  concentrationRisk: Array<{ commodity: string; exposure: string; percentage: number }>;
  correlationMatrix: Array<{ commodity1: string; commodity2: string; correlation: number }>;
}

export class VectorAnalytics {
  constructor() {}

  async getOverviewMetrics(): Promise<OverviewMetrics> {
    const markets = await storage.getAllMarkets();
    const prices = await storage.getAllPrices();
    
    // Calculate total volume
    const totalVolume24h = prices.reduce((sum, price) => 
      sum + parseFloat(price.volume24h), 0
    ).toFixed(2);

    // Calculate total open interest
    const totalOpenInterest = prices.reduce((sum, price) => 
      sum + parseFloat(price.openInterest), 0
    ).toFixed(2);

    // Calculate average spread (mock calculation)
    const averageSpread = "0.05"; // 5 basis points

    // Mock platform TVL
    const platformTvl = (parseFloat(totalOpenInterest) * 0.8).toFixed(2);

    return {
      totalVolume24h,
      totalTrades24h: Math.floor(Math.random() * 10000) + 5000,
      activeMarkets: markets.filter(m => m.isActive).length,
      totalOpenInterest,
      averageSpread,
      platformTvl
    };
  }

  async getCommodityMetrics(): Promise<CommodityMetrics[]> {
    const markets = await storage.getAllMarkets();
    const prices = await storage.getAllPrices();

    const categories = [
      CommodityCategory.PRECIOUS_METALS,
      CommodityCategory.ENERGY,
      CommodityCategory.AGRICULTURE,
      CommodityCategory.INDUSTRIAL_METALS
    ];

    const metrics: CommodityMetrics[] = [];

    for (const category of categories) {
      const categoryMarkets = markets.filter(m => m.category === category);
      const categoryPrices = prices.filter(p => 
        categoryMarkets.some(m => m.id === p.marketId)
      );

      const volume24h = categoryPrices.reduce((sum, price) => 
        sum + parseFloat(price.volume24h), 0
      ).toFixed(2);

      const avgChange = categoryPrices.reduce((sum, price) => 
        sum + parseFloat(price.change24h), 0
      ) / categoryPrices.length;

      // Find top performer
      const topPerformer = categoryPrices.reduce((best, current) => 
        parseFloat(current.change24h) > parseFloat(best.change24h) ? current : best
      );

      const topMarket = categoryMarkets.find(m => m.id === topPerformer.marketId);

      // Calculate average volatility (mock)
      const averageVolatility = (Math.random() * 20 + 5).toFixed(2);

      metrics.push({
        category,
        volume24h,
        changePercent: avgChange.toFixed(2),
        topPerformer: {
          symbol: topMarket?.symbol || "N/A",
          change: topPerformer.change24h
        },
        marketCount: categoryMarkets.length,
        averageVolatility
      });
    }

    return metrics;
  }

  async getVolumeMetrics(): Promise<VolumeMetrics> {
    const markets = await storage.getAllMarkets();
    const prices = await storage.getAllPrices();

    // Generate hourly volume data for last 24 hours
    const hourly = Array.from({ length: 24 }, (_, i) => {
      const hour = 23 - i;
      const baseVolume = Math.random() * 1000000 + 500000;
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        volume: baseVolume.toFixed(0)
      };
    }).reverse();

    // Generate daily volume data for last 30 days
    const daily = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const baseVolume = Math.random() * 10000000 + 5000000;
      return {
        date: date.toISOString().split('T')[0],
        volume: baseVolume.toFixed(0)
      };
    });

    // Volume by category
    const totalVolume = prices.reduce((sum, price) => sum + parseFloat(price.volume24h), 0);
    const categories = [
      CommodityCategory.PRECIOUS_METALS,
      CommodityCategory.ENERGY,
      CommodityCategory.AGRICULTURE,
      CommodityCategory.INDUSTRIAL_METALS
    ];

    const byCategory = categories.map(category => {
      const categoryMarkets = markets.filter(m => m.category === category);
      const categoryVolume = prices
        .filter(p => categoryMarkets.some(m => m.id === p.marketId))
        .reduce((sum, price) => sum + parseFloat(price.volume24h), 0);
      
      return {
        category,
        volume: categoryVolume.toFixed(2),
        percentage: totalVolume > 0 ? (categoryVolume / totalVolume) * 100 : 0
      };
    });

    // Top markets by volume
    const topMarkets = prices
      .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
      .slice(0, 10)
      .map(price => {
        const market = markets.find(m => m.id === price.marketId);
        return {
          symbol: market?.symbol || "N/A",
          volume: price.volume24h,
          change: price.change24h
        };
      });

    return {
      hourly,
      daily,
      byCategory,
      topMarkets
    };
  }

  async getFeeMetrics(): Promise<FeeMetrics> {
    const prices = await storage.getAllPrices();
    
    const totalVolume = prices.reduce((sum, price) => sum + parseFloat(price.volume24h), 0);
    const averageFeeRate = 0.001; // 0.1%
    const totalFeesCollected = (totalVolume * averageFeeRate).toFixed(2);
    
    // Mock rebates (30% of fees)
    const rebatesPaid = (parseFloat(totalFeesCollected) * 0.3).toFixed(2);
    const netFeeRevenue = (parseFloat(totalFeesCollected) - parseFloat(rebatesPaid)).toFixed(2);

    const categories = [
      CommodityCategory.PRECIOUS_METALS,
      CommodityCategory.ENERGY,
      CommodityCategory.AGRICULTURE,
      CommodityCategory.INDUSTRIAL_METALS
    ];

    const feesByCategory = categories.map(category => ({
      category,
      fees: (Math.random() * 10000 + 5000).toFixed(2)
    }));

    return {
      totalFeesCollected,
      averageFeeRate: (averageFeeRate * 100).toFixed(3),
      feesByCategory,
      rebatesPaid,
      netFeeRevenue
    };
  }

  async getRiskMetrics(): Promise<RiskMetrics> {
    // Mock risk calculations
    const totalPositionsAtRisk = Math.floor(Math.random() * 50) + 10;
    const averageHealthFactor = (1.2 + Math.random() * 0.8).toFixed(3);
    const liquidationBuffer = (Math.random() * 5000000 + 1000000).toFixed(2);

    // Mock concentration risk
    const commodities = [
      "GOLD",
      "CRUDE_OIL_WTI",
      "COPPER",
      "SILVER",
      "NATURAL_GAS"
    ];

    const concentrationRisk = commodities.map(commodity => {
      const exposure = Math.random() * 10000000 + 1000000;
      return {
        commodity,
        exposure: exposure.toFixed(2),
        percentage: Math.random() * 25 + 5 // 5-30%
      };
    });

    // Mock correlation matrix (simplified)
    const correlationMatrix = [
      { commodity1: "GOLD", commodity2: "SILVER", correlation: 0.85 },
      { commodity1: "CRUDE_OIL_WTI", commodity2: "NATURAL_GAS", correlation: 0.65 },
      { commodity1: "COPPER", commodity2: "ALUMINUM", correlation: 0.75 },
      { commodity1: "GOLD", commodity2: "CRUDE_OIL_WTI", correlation: -0.15 },
      { commodity1: "SILVER", commodity2: "COPPER", correlation: 0.45 }
    ];

    return {
      totalPositionsAtRisk,
      averageHealthFactor,
      liquidationBuffer,
      concentrationRisk,
      correlationMatrix
    };
  }

  async getFullAnalytics(): Promise<AnalyticsData> {
    const [overview, commodities, volumes, fees, riskMetrics] = await Promise.all([
      this.getOverviewMetrics(),
      this.getCommodityMetrics(),
      this.getVolumeMetrics(),
      this.getFeeMetrics(),
      this.getRiskMetrics()
    ]);

    return {
      overview,
      commodities,
      volumes,
      fees,
      riskMetrics
    };
  }

  async getPortfolioAnalytics(userId: string) {
    const portfolio = await storage.getPortfolio(userId);
    const positions = await storage.getUserPositions(userId);
    
    if (!portfolio) {
      throw new Error("Portfolio not found");
    }

    // Calculate portfolio metrics
    const totalValue = parseFloat(portfolio.totalValue);
    const availableBalance = parseFloat(portfolio.availableBalance);
    const usedMargin = parseFloat(portfolio.usedMargin);
    const totalPnl = parseFloat(portfolio.totalPnl);

    // Portfolio allocation by category
    const allocationByCategory = {
      [CommodityCategory.PRECIOUS_METALS]: 0,
      [CommodityCategory.ENERGY]: 0,
      [CommodityCategory.AGRICULTURE]: 0,
      [CommodityCategory.INDUSTRIAL_METALS]: 0
    };

    // Risk metrics
    const marginUtilization = totalValue > 0 ? (usedMargin / totalValue) * 100 : 0;
    const portfolioHealth = Math.max(0, Math.min(100, 100 - marginUtilization));
    
    // Performance metrics
    const roi = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;
    const sharpeRatio = roi / Math.max(1, Math.abs(roi) * 0.1); // Simplified Sharpe ratio

    return {
      summary: {
        totalValue: totalValue.toFixed(2),
        availableBalance: availableBalance.toFixed(2),
        usedMargin: usedMargin.toFixed(2),
        totalPnl: totalPnl.toFixed(2),
        roi: roi.toFixed(2),
        portfolioHealth: portfolioHealth.toFixed(1)
      },
      risk: {
        marginUtilization: marginUtilization.toFixed(2),
        sharpeRatio: sharpeRatio.toFixed(3),
        maxDrawdown: (Math.random() * 15 + 5).toFixed(2), // Mock
        volatility: (Math.random() * 25 + 10).toFixed(2) // Mock
      },
      allocation: allocationByCategory,
      positions: positions.length,
      riskLevel: portfolio.riskLevel
    };
  }
}

export const analytics = new VectorAnalytics();