import { CommodityCategory } from '@shared/schema';

export interface Position {
  id: string;
  userId: string;
  marketId: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  healthFactor: number;
  liquidationPrice: number;
  lastUpdate: number;
}

export interface LiquidationCandidate {
  position: Position;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedLoss: number;
  liquidationReward: number;
  timeToLiquidation: number; // seconds
}

export interface RiskParameters {
  category: CommodityCategory;
  initialMarginRatio: number;
  maintenanceMarginRatio: number;
  liquidationFee: number;
  insuranceFundFee: number;
  maxLeverage: number;
  volatilityScalar: number;
}

export interface LiquidationEvent {
  id: string;
  positionId: string;
  userId: string;
  marketId: string;
  liquidationPrice: number;
  liquidationSize: number;
  liquidationFee: number;
  insuranceFundContribution: number;
  liquidator: string;
  timestamp: number;
  reason: 'health_factor' | 'margin_call' | 'forced';
}

export interface HealthFactorCalculation {
  totalCollateral: number;
  totalMargin: number;
  unrealizedPnl: number;
  healthFactor: number;
  isLiquidatable: boolean;
  marginCallThreshold: number;
  liquidationThreshold: number;
}

class LiquidationEngine {
  private positions: Map<string, Position> = new Map();
  private liquidationQueue: LiquidationCandidate[] = [];
  private riskParams: Map<CommodityCategory, RiskParameters> = new Map();
  private liquidationHistory: LiquidationEvent[] = [];
  private isRunning: boolean = false;

  constructor() {
    this.initializeRiskParameters();
    this.initializeMockPositions();
    this.startMonitoring();
  }

  private initializeRiskParameters(): void {
    // Set commodity-specific risk parameters based on volatility and liquidity
    this.riskParams.set(CommodityCategory.PRECIOUS_METALS, {
      category: CommodityCategory.PRECIOUS_METALS,
      initialMarginRatio: 0.05, // 5% initial margin (20x leverage)
      maintenanceMarginRatio: 0.03, // 3% maintenance margin
      liquidationFee: 0.005, // 0.5% liquidation fee
      insuranceFundFee: 0.002, // 0.2% to insurance fund
      maxLeverage: 20,
      volatilityScalar: 1.0
    });

    this.riskParams.set(CommodityCategory.ENERGY, {
      category: CommodityCategory.ENERGY,
      initialMarginRatio: 0.08, // 8% initial margin (12.5x leverage)
      maintenanceMarginRatio: 0.05, // 5% maintenance margin
      liquidationFee: 0.007, // 0.7% liquidation fee
      insuranceFundFee: 0.003, // 0.3% to insurance fund
      maxLeverage: 12,
      volatilityScalar: 1.5
    });

    this.riskParams.set(CommodityCategory.AGRICULTURE, {
      category: CommodityCategory.AGRICULTURE,
      initialMarginRatio: 0.1, // 10% initial margin (10x leverage)
      maintenanceMarginRatio: 0.06, // 6% maintenance margin
      liquidationFee: 0.008, // 0.8% liquidation fee
      insuranceFundFee: 0.003, // 0.3% to insurance fund
      maxLeverage: 10,
      volatilityScalar: 2.0
    });

    this.riskParams.set(CommodityCategory.INDUSTRIAL_METALS, {
      category: CommodityCategory.INDUSTRIAL_METALS,
      initialMarginRatio: 0.06, // 6% initial margin (16.7x leverage)
      maintenanceMarginRatio: 0.04, // 4% maintenance margin
      liquidationFee: 0.006, // 0.6% liquidation fee
      insuranceFundFee: 0.0025, // 0.25% to insurance fund
      maxLeverage: 16,
      volatilityScalar: 1.2
    });
  }

  private initializeMockPositions(): void {
    // Create mock positions for testing
    const mockPositions: Position[] = [
      {
        id: 'pos_001',
        userId: 'user_001',
        marketId: 'gold-xau',
        side: 'long',
        size: 10,
        entryPrice: 2650,
        currentPrice: 2625, // 0.94% down
        leverage: 15,
        margin: 1766.67, // $26,500 / 15
        unrealizedPnl: -250, // (2625 - 2650) * 10
        healthFactor: 1.85,
        liquidationPrice: 2491.67,
        lastUpdate: Date.now()
      },
      {
        id: 'pos_002',
        userId: 'user_002',
        marketId: 'crude-oil-wti',
        side: 'short',
        size: 100,
        entryPrice: 85.2,
        currentPrice: 87.8, // 3.05% up (bad for short)
        leverage: 10,
        margin: 852, // $8,520 / 10
        unrealizedPnl: -260, // (85.2 - 87.8) * 100
        healthFactor: 1.15, // Close to liquidation
        liquidationPrice: 94.72,
        lastUpdate: Date.now()
      },
      {
        id: 'pos_003',
        userId: 'user_003',
        marketId: 'silver-xag',
        side: 'long',
        size: 1000,
        entryPrice: 31.5,
        currentPrice: 31.2, // 0.95% down
        leverage: 8,
        margin: 3937.5, // $31,500 / 8
        unrealizedPnl: -300, // (31.2 - 31.5) * 1000
        healthFactor: 2.35,
        liquidationPrice: 27.56,
        lastUpdate: Date.now()
      },
      {
        id: 'pos_004',
        userId: 'user_004',
        marketId: 'copper-hg',
        side: 'long',
        size: 500,
        entryPrice: 4.25,
        currentPrice: 4.05, // 4.7% down
        leverage: 12,
        margin: 177.08, // $2,125 / 12
        unrealizedPnl: -100, // (4.05 - 4.25) * 500
        healthFactor: 0.95, // Critical - needs liquidation
        liquidationPrice: 4.04,
        lastUpdate: Date.now()
      }
    ];

    mockPositions.forEach(position => {
      this.positions.set(position.id, position);
    });
  }

  private startMonitoring(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Liquidation engine started monitoring positions...');

    // Monitor positions every 5 seconds
    setInterval(() => {
      this.updatePositionPrices();
      this.scanForLiquidations();
      this.processLiquidationQueue();
    }, 5000);

    // Health check every minute
    setInterval(() => {
      this.performHealthCheck();
    }, 60000);
  }

  private updatePositionPrices(): void {
    // Simulate price updates for positions
    this.positions.forEach(position => {
      // Simulate price volatility based on commodity category
      const category = this.getCategoryForMarket(position.marketId);
      const riskParams = this.riskParams.get(category)!;
      const volatility = 0.001 * riskParams.volatilityScalar; // Base 0.1% volatility
      
      const priceChange = (Math.random() - 0.5) * 2 * volatility;
      position.currentPrice *= (1 + priceChange);
      
      // Recalculate position metrics
      this.recalculatePositionMetrics(position);
    });
  }

  private recalculatePositionMetrics(position: Position): void {
    const category = this.getCategoryForMarket(position.marketId);
    const riskParams = this.riskParams.get(category)!;

    // Calculate unrealized PnL
    if (position.side === 'long') {
      position.unrealizedPnl = (position.currentPrice - position.entryPrice) * position.size;
    } else {
      position.unrealizedPnl = (position.entryPrice - position.currentPrice) * position.size;
    }

    // Calculate health factor
    const totalValue = position.entryPrice * position.size;
    const equity = position.margin + position.unrealizedPnl;
    const requiredMargin = totalValue * riskParams.maintenanceMarginRatio;
    
    position.healthFactor = equity / requiredMargin;

    // Calculate liquidation price
    if (position.side === 'long') {
      position.liquidationPrice = position.entryPrice * (1 - riskParams.maintenanceMarginRatio * position.leverage);
    } else {
      position.liquidationPrice = position.entryPrice * (1 + riskParams.maintenanceMarginRatio * position.leverage);
    }

    position.lastUpdate = Date.now();
  }

  private scanForLiquidations(): void {
    const candidates: LiquidationCandidate[] = [];

    this.positions.forEach(position => {
      if (position.healthFactor <= 1.0) {
        const candidate = this.createLiquidationCandidate(position);
        candidates.push(candidate);
      }
    });

    // Sort by urgency and estimated loss
    candidates.sort((a, b) => {
      const urgencyOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.estimatedLoss - a.estimatedLoss; // Higher loss first
    });

    this.liquidationQueue = candidates;
  }

  private createLiquidationCandidate(position: Position): LiquidationCandidate {
    const category = this.getCategoryForMarket(position.marketId);
    const riskParams = this.riskParams.get(category)!;

    // Determine urgency based on health factor
    let urgency: 'low' | 'medium' | 'high' | 'critical';
    if (position.healthFactor <= 0.5) urgency = 'critical';
    else if (position.healthFactor <= 0.7) urgency = 'high';
    else if (position.healthFactor <= 0.9) urgency = 'medium';
    else urgency = 'low';

    // Calculate estimated loss to insurance fund
    const positionValue = position.currentPrice * position.size;
    const equity = position.margin + position.unrealizedPnl;
    const estimatedLoss = Math.max(0, -equity); // Loss if position is underwater

    // Calculate liquidation reward for liquidator
    const liquidationReward = positionValue * riskParams.liquidationFee * 0.5; // 50% of fee to liquidator

    // Estimate time to liquidation based on current volatility
    const priceDistance = Math.abs(position.currentPrice - position.liquidationPrice) / position.currentPrice;
    const volatility = riskParams.volatilityScalar * 0.001; // Estimated volatility per second
    const timeToLiquidation = priceDistance / volatility; // Rough estimate in seconds

    return {
      position,
      urgency,
      estimatedLoss,
      liquidationReward,
      timeToLiquidation
    };
  }

  private processLiquidationQueue(): void {
    if (this.liquidationQueue.length === 0) return;

    // Process up to 5 liquidations per cycle to avoid overwhelming the system
    const toProcess = this.liquidationQueue.splice(0, 5);

    toProcess.forEach(candidate => {
      this.executeLiquidation(candidate);
    });
  }

  private executeLiquidation(candidate: LiquidationCandidate): void {
    const position = candidate.position;
    const category = this.getCategoryForMarket(position.marketId);
    const riskParams = this.riskParams.get(category)!;

    // Calculate liquidation details
    const positionValue = position.currentPrice * position.size;
    const liquidationFee = positionValue * riskParams.liquidationFee;
    const insuranceFundFee = positionValue * riskParams.insuranceFundFee;

    // Create liquidation event
    const liquidationEvent: LiquidationEvent = {
      id: `liq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      positionId: position.id,
      userId: position.userId,
      marketId: position.marketId,
      liquidationPrice: position.currentPrice,
      liquidationSize: position.size,
      liquidationFee,
      insuranceFundContribution: insuranceFundFee,
      liquidator: 'liquidation_bot', // In practice, this would be the actual liquidator
      timestamp: Date.now(),
      reason: position.healthFactor <= 0.5 ? 'forced' : 'health_factor'
    };

    // Remove position from active positions
    this.positions.delete(position.id);

    // Add to liquidation history
    this.liquidationHistory.push(liquidationEvent);

    console.log(`Liquidated position ${position.id} for user ${position.userId} at price ${position.currentPrice.toFixed(4)}`);
  }

  private performHealthCheck(): void {
    const totalPositions = this.positions.size;
    const atRiskPositions = Array.from(this.positions.values()).filter(p => p.healthFactor < 1.5).length;
    const criticalPositions = Array.from(this.positions.values()).filter(p => p.healthFactor <= 1.0).length;

    console.log(`Health Check - Total: ${totalPositions}, At Risk: ${atRiskPositions}, Critical: ${criticalPositions}`);

    // Log any positions that need attention
    this.positions.forEach(position => {
      if (position.healthFactor <= 1.2) {
        console.warn(`Position ${position.id} health factor: ${position.healthFactor.toFixed(3)} - monitoring closely`);
      }
    });
  }

  private getCategoryForMarket(marketId: string): CommodityCategory {
    // Simple mapping based on market ID prefix
    if (marketId.includes('gold') || marketId.includes('silver') || marketId.includes('platinum') || marketId.includes('palladium')) {
      return CommodityCategory.PRECIOUS_METALS;
    } else if (marketId.includes('oil') || marketId.includes('gas') || marketId.includes('energy')) {
      return CommodityCategory.ENERGY;
    } else if (marketId.includes('corn') || marketId.includes('wheat') || marketId.includes('soy')) {
      return CommodityCategory.AGRICULTURE;
    } else {
      return CommodityCategory.INDUSTRIAL_METALS;
    }
  }

  // Public methods for API endpoints
  getPositionsAtRisk(): Position[] {
    return Array.from(this.positions.values()).filter(p => p.healthFactor < 1.5);
  }

  getLiquidationCandidates(): LiquidationCandidate[] {
    return [...this.liquidationQueue];
  }

  getLiquidationHistory(limit: number = 50): LiquidationEvent[] {
    return this.liquidationHistory.slice(-limit);
  }

  getPositionHealth(positionId: string): HealthFactorCalculation | null {
    const position = this.positions.get(positionId);
    if (!position) return null;

    const category = this.getCategoryForMarket(position.marketId);
    const riskParams = this.riskParams.get(category)!;

    const totalCollateral = position.margin;
    const totalMargin = position.entryPrice * position.size * riskParams.maintenanceMarginRatio;
    const equity = position.margin + position.unrealizedPnl;

    return {
      totalCollateral,
      totalMargin,
      unrealizedPnl: position.unrealizedPnl,
      healthFactor: position.healthFactor,
      isLiquidatable: position.healthFactor <= 1.0,
      marginCallThreshold: 1.2,
      liquidationThreshold: 1.0
    };
  }

  getAllPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getRiskParameters(): Map<CommodityCategory, RiskParameters> {
    return new Map(this.riskParams);
  }

  // Stress testing functions
  simulateMarketStress(scenario: 'minor' | 'moderate' | 'severe'): {
    liquidationsTriggered: number;
    totalLoss: number;
    positionsAffected: string[];
  } {
    const stressMultipliers = {
      minor: 0.05,    // 5% market move
      moderate: 0.15, // 15% market move  
      severe: 0.30    // 30% market move
    };

    const multiplier = stressMultipliers[scenario];
    const positionsAffected: string[] = [];
    let liquidationsTriggered = 0;
    let totalLoss = 0;

    // Simulate stress on all positions
    this.positions.forEach(position => {
      const originalPrice = position.currentPrice;
      const originalHealthFactor = position.healthFactor;

      // Apply stress (assume worst case - price moves against position)
      if (position.side === 'long') {
        position.currentPrice *= (1 - multiplier);
      } else {
        position.currentPrice *= (1 + multiplier);
      }

      this.recalculatePositionMetrics(position);

      if (position.healthFactor <= 1.0 && originalHealthFactor > 1.0) {
        liquidationsTriggered++;
        totalLoss += Math.abs(position.unrealizedPnl);
        positionsAffected.push(position.id);
      }

      // Restore original state
      position.currentPrice = originalPrice;
      this.recalculatePositionMetrics(position);
    });

    return {
      liquidationsTriggered,
      totalLoss,
      positionsAffected
    };
  }

  stop(): void {
    this.isRunning = false;
    console.log('Liquidation engine stopped');
  }
}

// Global liquidation engine instance
export const liquidationEngine = new LiquidationEngine();