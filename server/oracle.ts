import { 
  CommodityType,
  type OracleSource, 
  type AggregatedPrice, 
  type PriceUpdate 
} from "@shared/schema";

export class VectorOracleAggregator {
  private oracles: Map<string, OracleSource>;
  private priceCache: Map<string, AggregatedPrice>;
  private confidenceThreshold: number = 0.8;

  constructor() {
    this.oracles = new Map();
    this.priceCache = new Map();
    this.initializeOracles();
  }

  private initializeOracles() {
    // Primary oracle sources for commodities
    const oracleSources: OracleSource[] = [
      {
        name: "Pyth",
        endpoint: "https://pyth.network/api",
        weight: 40,
        isActive: true,
        confidence: 0.95
      },
      {
        name: "Switchboard",
        endpoint: "https://switchboard.xyz/api",
        weight: 30,
        isActive: true,
        confidence: 0.9
      },
      {
        name: "Chainlink",
        endpoint: "https://chainlink.com/api",
        weight: 20,
        isActive: true,
        confidence: 0.88
      },
      {
        name: "Vector Custom",
        endpoint: "https://vector-oracle.com/api",
        weight: 10,
        isActive: true,
        confidence: 0.85
      }
    ];

    oracleSources.forEach(oracle => {
      this.oracles.set(oracle.name, oracle);
    });
  }

  async getAggregatedPrice(commodity: string): Promise<AggregatedPrice> {
    const prices: Array<{ source: OracleSource; price: number; timestamp: number }> = [];

    // Fetch prices from all active oracles
    for (const [name, oracle] of this.oracles) {
      if (oracle.isActive) {
        try {
          const price = await this.fetchPriceFromOracle(oracle, commodity);
          if (price) {
            prices.push({ source: oracle, price: price.value, timestamp: price.timestamp });
          }
        } catch (error) {
          console.warn(`Oracle ${name} failed:`, error);
        }
      }
    }

    if (prices.length === 0) {
      throw new Error("No oracle prices available");
    }

    // Calculate weighted average
    const weightedPrice = this.calculateWeightedAverage(prices);
    const confidence = this.calculateConfidence(prices);
    const deviation = this.calculateDeviation(prices, weightedPrice);

    const aggregatedPrice: AggregatedPrice = {
      price: weightedPrice.toFixed(8),
      confidence,
      sources: prices.map(p => p.source),
      timestamp: Date.now(),
      deviation: deviation.toFixed(4)
    };

    // Cache the result
    this.priceCache.set(commodity, aggregatedPrice);
    
    return aggregatedPrice;
  }

  private async fetchPriceFromOracle(
    oracle: OracleSource, 
    commodity: string
  ): Promise<{ value: number; timestamp: number } | null> {
    // Simulate oracle price fetching
    // In real implementation, this would make HTTP calls to oracle endpoints
    const basePrice = this.getBasePriceForCommodity(commodity);
    const variation = (Math.random() - 0.5) * 0.01; // ±1% variation
    const oracleNoise = oracle.confidence * (Math.random() - 0.5) * 0.005; // Oracle-specific noise
    
    return {
      value: basePrice * (1 + variation + oracleNoise),
      timestamp: Date.now() - Math.random() * 1000 // Slight timestamp variation
    };
  }

  private calculateWeightedAverage(prices: Array<{ source: OracleSource; price: number }>): number {
    let totalWeight = 0;
    let weightedSum = 0;

    prices.forEach(({ source, price }) => {
      const weight = source.weight * source.confidence;
      weightedSum += price * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateConfidence(prices: Array<{ source: OracleSource; price: number }>): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0].source.confidence;

    // Calculate confidence based on price agreement and source reliability
    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const maxDeviation = Math.max(...prices.map(p => Math.abs(p.price - avgPrice) / avgPrice));
    
    const agreementScore = Math.max(0, 1 - maxDeviation * 10); // Penalize high deviation
    const sourceScore = prices.reduce((sum, p) => sum + p.source.confidence, 0) / prices.length;
    const diversityScore = Math.min(1, prices.length / 3); // Reward multiple sources

    return (agreementScore * 0.4 + sourceScore * 0.4 + diversityScore * 0.2);
  }

  private calculateDeviation(
    prices: Array<{ source: OracleSource; price: number }>, 
    weightedPrice: number
  ): number {
    if (prices.length === 0) return 0;
    
    const deviations = prices.map(p => Math.abs(p.price - weightedPrice) / weightedPrice);
    return Math.max(...deviations) * 100; // Return as percentage
  }

  private getBasePriceForCommodity(commodityType: string): number {
    const basePrices: Record<string, number> = {
      // Precious Metals
      [CommodityType.GOLD]: 2048.65,
      [CommodityType.SILVER]: 24.38,
      [CommodityType.PLATINUM]: 985.40,
      [CommodityType.PALLADIUM]: 1245.80,
      [CommodityType.RHODIUM]: 4850.00,
      [CommodityType.IRIDIUM]: 6800.00,
      [CommodityType.RUTHENIUM]: 485.00,
      [CommodityType.OSMIUM]: 12500.00,
      [CommodityType.RHENIUM]: 2850.00,
      [CommodityType.INDIUM]: 285.50,
      
      // Energy
      [CommodityType.CRUDE_OIL_WTI]: 78.25,
      [CommodityType.BRENT_CRUDE]: 82.15,
      [CommodityType.NATURAL_GAS]: 3.45,
      [CommodityType.GASOLINE]: 2.85,
      [CommodityType.HEATING_OIL]: 3.12,
      [CommodityType.COAL]: 185.50,
      [CommodityType.URANIUM]: 68.75,
      [CommodityType.ETHANOL]: 2.25,
      [CommodityType.PROPANE]: 1.85,
      [CommodityType.ELECTRICITY]: 45.25,
      
      // Agricultural
      [CommodityType.CORN]: 485.50,
      [CommodityType.WHEAT]: 612.25,
      [CommodityType.SOYBEANS]: 1245.75,
      [CommodityType.SUGAR]: 0.22,
      [CommodityType.COFFEE]: 1.68,
      [CommodityType.COCOA]: 2850.00,
      [CommodityType.COTTON]: 0.75,
      [CommodityType.RICE]: 18.45,
      [CommodityType.CATTLE]: 175.25,
      [CommodityType.LEAN_HOGS]: 82.50,
      
      // Industrial Metals
      [CommodityType.COPPER]: 3.85,
      [CommodityType.ALUMINUM]: 2.12,
      [CommodityType.ZINC]: 2.65,
      [CommodityType.NICKEL]: 18.45,
      [CommodityType.LEAD]: 2.15,
      [CommodityType.TIN]: 28.50,
      [CommodityType.IRON_ORE]: 125.75,
      [CommodityType.STEEL]: 685.25,
      [CommodityType.LITHIUM]: 15.25,
      [CommodityType.COBALT]: 28.85
    };
    return basePrices[commodityType] || 100;
  }

  getOracleHealth(): { [key: string]: { status: string; lastUpdate: number; confidence: number } } {
    const health: { [key: string]: { status: string; lastUpdate: number; confidence: number } } = {};
    
    this.oracles.forEach((oracle, name) => {
      health[name] = {
        status: oracle.isActive ? 'healthy' : 'inactive',
        lastUpdate: Date.now() - Math.random() * 30000, // Mock last update
        confidence: oracle.confidence
      };
    });
    
    return health;
  }
}

export const oracleAggregator = new VectorOracleAggregator();