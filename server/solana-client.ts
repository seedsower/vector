import { Connection, PublicKey, Keypair, clusterApiUrl } from '@solana/web3.js';
import { VectorProtocolClient, CommodityType, OrderType, PositionDirection } from '../client/src/solana/vector-protocol';
import { BN } from '@coral-xyz/anchor';

export class SolanaVectorProtocol {
  private connection: Connection;
  private vectorClient: VectorProtocolClient;
  private authority: Keypair;
  private exchangeInitialized: boolean = false;

  constructor() {
    // Use devnet for development
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    
    // For demo purposes, create a keypair (in production, this would be loaded securely)
    this.authority = Keypair.generate();
    
    // Initialize Vector Protocol client
    const wallet = {
      publicKey: this.authority.publicKey,
      signTransaction: async (tx: any) => {
        tx.sign(this.authority);
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        txs.forEach(tx => tx.sign(this.authority));
        return txs;
      },
    };
    
    this.vectorClient = new VectorProtocolClient(this.connection, wallet);
    this.initializeProtocol();
  }

  private async initializeProtocol(): Promise<void> {
    try {
      // Check if exchange is already initialized
      const exchange = await this.vectorClient.getExchange();
      
      if (!exchange) {
        console.log('Initializing Vector Protocol exchange...');
        
        // Request airdrop for demo
        const airdropSignature = await this.connection.requestAirdrop(
          this.authority.publicKey,
          2_000_000_000 // 2 SOL
        );
        await this.connection.confirmTransaction(airdropSignature);
        
        // Initialize exchange
        const feeStructure = VectorProtocolClient.createDefaultFeeStructure();
        await this.vectorClient.initializeExchange(this.authority, feeStructure);
        
        // Initialize all 40 commodity markets
        await this.initializeAllCommodityMarkets();
        
        console.log('Vector Protocol exchange initialized successfully!');
      }
      
      this.exchangeInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Vector Protocol:', error);
    }
  }

  private async initializeAllCommodityMarkets(): Promise<void> {
    const commodities = VectorProtocolClient.getAllCommodityTypes();
    
    for (let i = 0; i < commodities.length; i++) {
      const commodity = commodities[i];
      
      try {
        await this.vectorClient.initializeCommodityMarket(
          this.authority,
          i,
          commodity,
          PublicKey.default, // Oracle source (would be real oracle in production)
          new BN(1_000_000_000), // Base asset reserve
          new BN(1_000_000_000), // Quote asset reserve
          new BN(3600), // 1 hour funding period
          20 // Maximum leverage
        );
        
        console.log(`Initialized market for ${commodity}`);
      } catch (error) {
        console.error(`Failed to initialize market for ${commodity}:`, error);
      }
    }
  }

  // Market Data Methods
  async getAllMarkets(): Promise<any[]> {
    if (!this.exchangeInitialized) {
      return this.getMockMarkets();
    }

    try {
      const markets = await this.vectorClient.getAllMarkets();
      return markets.map((market, index) => ({
        symbol: `${VectorProtocolClient.getAllCommodityTypes()[index]}-PERP`,
        name: `${VectorProtocolClient.getAllCommodityTypes()[index]} Perpetual`,
        category: VectorProtocolClient.getCommodityCategory(VectorProtocolClient.getAllCommodityTypes()[index]),
        price: this.vectorClient.calculateMarkPrice(market.account),
        change24h: (Math.random() - 0.5) * 10, // Mock for demo
        volume24h: Math.random() * 10_000_000,
        openInterest: Math.random() * 100_000_000,
        fundingRate: this.vectorClient.calculateFundingRate(market.account),
        marketIndex: index,
        isActive: market.account.isActive,
      }));
    } catch (error) {
      console.error('Error fetching markets from Solana:', error);
      return this.getMockMarkets();
    }
  }

  async getMarketBySymbol(symbol: string): Promise<any> {
    const markets = await this.getAllMarkets();
    return markets.find(market => market.symbol === symbol);
  }

  // Trading Methods
  async placeOrder(
    userAuthority: PublicKey,
    marketSymbol: string,
    orderType: string,
    side: string,
    size: number,
    price?: number
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    if (!this.exchangeInitialized) {
      return { 
        success: false, 
        error: 'Vector Protocol not initialized' 
      };
    }

    try {
      // Convert parameters to Solana types
      const markets = await this.getAllMarkets();
      const market = markets.find(m => m.symbol === marketSymbol);
      
      if (!market) {
        return { success: false, error: 'Market not found' };
      }

      const orderTypeEnum = orderType === 'market' ? OrderType.Market : OrderType.Limit;
      const direction = side === 'buy' ? PositionDirection.Long : PositionDirection.Short;
      const baseAssetAmount = new BN(size * 1e6); // Convert to micro units
      const orderPrice = new BN((price || market.price) * 1e6);

      // For demo, use our authority (in production, user would sign)
      const signature = await this.vectorClient.placePerpOrder(
        this.authority,
        orderTypeEnum,
        market.marketIndex,
        baseAssetAmount,
        orderPrice,
        direction
      );

      return {
        success: true,
        orderId: signature
      };
    } catch (error) {
      console.error('Error placing order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // User Account Methods
  async getUserAccount(userAuthority: PublicKey): Promise<any> {
    if (!this.exchangeInitialized) {
      return null;
    }

    try {
      let user = await this.vectorClient.getUser(userAuthority);
      
      if (!user) {
        // Initialize user account if it doesn't exist
        await this.vectorClient.initializeUserAccount(this.authority, 1);
        user = await this.vectorClient.getUser(userAuthority);
      }

      return user ? {
        authority: user.authority.toString(),
        userId: user.userId,
        collateral: user.collateral.toNumber() / 1e6,
        totalFeePaid: user.totalFeePaid.toNumber() / 1e6,
        isMarginTradingEnabled: user.isMarginTradingEnabled,
        isLiquidationCandidate: user.isLiquidationCandidate,
      } : null;
    } catch (error) {
      console.error('Error fetching user account:', error);
      return null;
    }
  }

  // Oracle Methods
  async updateOraclePrices(): Promise<void> {
    if (!this.exchangeInitialized) return;

    try {
      const commodities = VectorProtocolClient.getAllCommodityTypes();
      const oracleUpdates = commodities.map((_, index) => ({
        marketIndex: index,
        price: new BN(this.getRandomPrice(index) * 1e6),
        confidence: 95 + Math.floor(Math.random() * 5), // 95-99% confidence
      }));

      await this.vectorClient.updateOraclePrices(this.authority, oracleUpdates);
    } catch (error) {
      console.error('Error updating oracle prices:', error);
    }
  }

  // Liquidation Methods
  async checkLiquidations(): Promise<any[]> {
    if (!this.exchangeInitialized) return [];

    try {
      const users = await this.vectorClient.getAllUsers();
      const liquidationCandidates = [];

      for (const user of users) {
        if (user.account.isLiquidationCandidate) {
          liquidationCandidates.push({
            userAuthority: user.account.authority.toString(),
            collateral: user.account.collateral.toNumber() / 1e6,
            marginRatio: user.account.marginRatio,
          });
        }
      }

      return liquidationCandidates;
    } catch (error) {
      console.error('Error checking liquidations:', error);
      return [];
    }
  }

  // Helper Methods
  private getMockMarkets(): any[] {
    const commodities = VectorProtocolClient.getAllCommodityTypes();
    return commodities.map((commodity, index) => ({
      symbol: `${commodity}-PERP`,
      name: `${commodity} Perpetual`,
      category: VectorProtocolClient.getCommodityCategory(commodity),
      price: this.getRandomPrice(index),
      change24h: (Math.random() - 0.5) * 10,
      volume24h: Math.random() * 10_000_000,
      openInterest: Math.random() * 100_000_000,
      fundingRate: (Math.random() - 0.5) * 0.01,
      marketIndex: index,
      isActive: true,
    }));
  }

  private getRandomPrice(marketIndex: number): number {
    const basePrices = [
      2048.65, 24.38, 985.40, 1245.80, 4850.00, 6800.00, 485.00, 12500.00, 2850.00, 285.50, // Precious metals
      78.25, 82.15, 3.45, 2.85, 3.12, 185.50, 68.75, 2.25, 1.85, 45.25, // Energy
      485.50, 612.25, 1245.75, 0.22, 1.68, 2850.00, 0.75, 18.45, 175.25, 82.50, // Agriculture
      3.85, 2.12, 2.65, 18.45, 2.15, 28.50, 125.75, 685.25, 15.25, 28.85 // Industrial metals
    ];
    
    const basePrice = basePrices[marketIndex] || 100;
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    return basePrice * (1 + variation);
  }

  // Start background processes
  startBackgroundProcesses(): void {
    // Update oracle prices every 30 seconds
    setInterval(() => {
      this.updateOraclePrices();
    }, 30000);

    // Check for liquidations every 60 seconds
    setInterval(() => {
      this.checkLiquidations();
    }, 60000);
  }

  // Connection status
  isConnected(): boolean {
    return this.exchangeInitialized;
  }

  getConnectionStatus(): string {
    return this.exchangeInitialized ? 'Connected to Vector Protocol on Solana' : 'Connecting...';
  }
}

// Global instance
export const solanaVectorProtocol = new SolanaVectorProtocol();