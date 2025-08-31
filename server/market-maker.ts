import {
  CommodityType,
  CommodityCategory,
  type MarketMakerStats,
  type RebateCalculation
} from "@shared/schema";

export class VectorMarketMakerProgram {
  private makerStats: Map<string, MarketMakerStats>;
  private tierThresholds: { [key: string]: { volume: number; depthScore: number } };

  constructor() {
    this.makerStats = new Map();
    this.tierThresholds = {
      bronze: { volume: 0, depthScore: 0 },
      silver: { volume: 100000, depthScore: 50 },
      gold: { volume: 500000, depthScore: 75 },
      platinum: { volume: 1000000, depthScore: 85 },
      diamond: { volume: 5000000, depthScore: 95 }
    };
  }

  async calculateRebates(
    userId: string,
    commodityType: string,
    volume: number
  ): Promise<RebateCalculation> {
    const stats = await this.getMakerStats(userId);
    
    // Base rebate rates by tier
    const baseRebates = {
      bronze: 0.0001,   // 0.01%
      silver: 0.0002,   // 0.02%
      gold: 0.0003,     // 0.03%
      platinum: 0.0004, // 0.04%
      diamond: 0.0005   // 0.05%
    };

    const baseRebate = baseRebates[stats.tier as keyof typeof baseRebates] || baseRebates.bronze;
    
    // Volume-based bonus (up to 50% additional)
    const volumeBonus = Math.min(0.5, stats.volume30d / 10000000 * 0.5);
    
    // Depth score bonus (up to 25% additional)
    const depthBonus = Math.min(0.25, stats.depthScore / 100 * 0.25);
    
    // Commodity-specific multipliers
    const commodityMultiplier = this.getCommodityMultiplier(commodityType);
    
    // Calculate total rebate
    const totalRebate = baseRebate * (1 + volumeBonus + depthBonus) * commodityMultiplier;
    
    // Vector token rewards (additional incentive)
    const vectorTokenRewards = (volume * totalRebate * 10).toFixed(6); // 10x the rebate in VECTOR tokens

    return {
      baseRebate,
      volumeBonus,
      depthBonus,
      commodityMultiplier,
      totalRebate,
      vectorTokenRewards
    };
  }

  private getCommodityMultiplier(commodityType: string): number {
    // Higher multipliers for less liquid commodities to incentivize market making
    const multipliers: { [key: string]: number } = {
      // Precious Metals - High liquidity, standard multipliers
      [CommodityType.GOLD]: 1.0,
      [CommodityType.SILVER]: 1.1,
      [CommodityType.PLATINUM]: 1.3,
      [CommodityType.PALLADIUM]: 1.4,
      [CommodityType.RHODIUM]: 2.0,
      [CommodityType.IRIDIUM]: 2.5,
      [CommodityType.RUTHENIUM]: 2.2,
      [CommodityType.OSMIUM]: 3.0,
      [CommodityType.RHENIUM]: 2.8,
      [CommodityType.INDIUM]: 2.0,
      
      // Energy - Medium to high liquidity
      [CommodityType.CRUDE_OIL_WTI]: 1.0,
      [CommodityType.BRENT_CRUDE]: 1.0,
      [CommodityType.NATURAL_GAS]: 1.2,
      [CommodityType.GASOLINE]: 1.3,
      [CommodityType.HEATING_OIL]: 1.3,
      [CommodityType.COAL]: 1.6,
      [CommodityType.URANIUM]: 1.8,
      [CommodityType.ETHANOL]: 1.5,
      [CommodityType.PROPANE]: 1.4,
      [CommodityType.ELECTRICITY]: 2.0,
      
      // Agricultural - Seasonal and medium liquidity
      [CommodityType.CORN]: 1.2,
      [CommodityType.WHEAT]: 1.2,
      [CommodityType.SOYBEANS]: 1.1,
      [CommodityType.SUGAR]: 1.3,
      [CommodityType.COFFEE]: 1.4,
      [CommodityType.COCOA]: 1.5,
      [CommodityType.COTTON]: 1.4,
      [CommodityType.RICE]: 1.6,
      [CommodityType.CATTLE]: 1.8,
      [CommodityType.LEAN_HOGS]: 1.8,
      
      // Industrial Metals - High strategic value
      [CommodityType.COPPER]: 1.1,
      [CommodityType.ALUMINUM]: 1.2,
      [CommodityType.ZINC]: 1.3,
      [CommodityType.NICKEL]: 1.4,
      [CommodityType.LEAD]: 1.5,
      [CommodityType.TIN]: 1.6,
      [CommodityType.IRON_ORE]: 1.3,
      [CommodityType.STEEL]: 1.4,
      [CommodityType.LITHIUM]: 1.5,
      [CommodityType.COBALT]: 1.7
    };
    
    return multipliers[commodityType] || 1.0;
  }

  async getMakerStats(userId: string): Promise<MarketMakerStats> {
    let stats = this.makerStats.get(userId);
    
    if (!stats) {
      // Initialize new maker
      stats = {
        userId,
        volume30d: "0",
        depthScore: 0,
        uptimeScore: 100,
        tier: "bronze"
      };
      this.makerStats.set(userId, stats);
    }
    
    // Update tier based on current stats
    stats.tier = this.calculateTier(parseFloat(stats.volume30d), stats.depthScore);
    
    return stats;
  }

  private calculateTier(volume30d: number, depthScore: number): string {
    const tiers = Object.entries(this.tierThresholds)
      .sort(([,a], [,b]) => b.volume - a.volume);
    
    for (const [tier, thresholds] of tiers) {
      if (volume30d >= thresholds.volume && depthScore >= thresholds.depthScore) {
        return tier;
      }
    }
    
    return "bronze";
  }

  async updateMakerStats(
    userId: string, 
    volume: number, 
    depthContribution: number,
    uptimePercentage: number
  ): Promise<MarketMakerStats> {
    const stats = await this.getMakerStats(userId);
    
    // Update 30-day rolling volume
    const currentVolume = parseFloat(stats.volume30d);
    stats.volume30d = (currentVolume + volume).toString();
    
    // Update depth score (weighted average)
    stats.depthScore = (stats.depthScore * 0.9 + depthContribution * 0.1);
    
    // Update uptime score
    stats.uptimeScore = Math.min(100, uptimePercentage);
    
    // Recalculate tier
    stats.tier = this.calculateTier(parseFloat(stats.volume30d), stats.depthScore);
    
    this.makerStats.set(userId, stats);
    return stats;
  }

  getTierBenefits(tier: string) {
    const benefits = {
      bronze: {
        rebateMultiplier: 1.0,
        prioritySupport: false,
        advancedTools: false,
        customApi: false
      },
      silver: {
        rebateMultiplier: 1.1,
        prioritySupport: true,
        advancedTools: false,
        customApi: false
      },
      gold: {
        rebateMultiplier: 1.2,
        prioritySupport: true,
        advancedTools: true,
        customApi: false
      },
      platinum: {
        rebateMultiplier: 1.3,
        prioritySupport: true,
        advancedTools: true,
        customApi: true
      },
      diamond: {
        rebateMultiplier: 1.5,
        prioritySupport: true,
        advancedTools: true,
        customApi: true
      }
    };
    
    return benefits[tier as keyof typeof benefits] || benefits.bronze;
  }

  getLeaderboard(limit: number = 10): MarketMakerStats[] {
    return Array.from(this.makerStats.values())
      .sort((a, b) => parseFloat(b.volume30d) - parseFloat(a.volume30d))
      .slice(0, limit);
  }
}

export const marketMakerProgram = new VectorMarketMakerProgram();