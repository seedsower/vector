import { 
  type User, 
  type InsertUser,
  type CommodityMarket,
  type InsertCommodityMarket,
  type Price,
  type Order,
  type InsertOrder,
  type Position,
  type InsertPosition,
  type Portfolio,
  type Trade,
  type InsertTrade,
  CommodityType,
  CommodityCategory,
  MarketType,
  OrderStatus,
  PositionSide
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Markets
  getAllMarkets(): Promise<CommodityMarket[]>;
  getMarketsByCategory(category: string): Promise<CommodityMarket[]>;
  getMarket(id: string): Promise<CommodityMarket | undefined>;
  createMarket(market: InsertCommodityMarket): Promise<CommodityMarket>;

  // Prices
  getPrice(marketId: string): Promise<Price | undefined>;
  getAllPrices(): Promise<Price[]>;
  updatePrice(marketId: string, price: Partial<Price>): Promise<Price | undefined>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: OrderStatus, filledSize?: string): Promise<Order | undefined>;

  // Positions
  createPosition(position: InsertPosition): Promise<Position>;
  getUserPositions(userId: string): Promise<Position[]>;
  getPosition(userId: string, marketId: string): Promise<Position | undefined>;
  updatePosition(id: string, updates: Partial<Position>): Promise<Position | undefined>;
  closePosition(id: string): Promise<boolean>;

  // Portfolio
  getPortfolio(userId: string): Promise<Portfolio | undefined>;
  updatePortfolio(userId: string, updates: Partial<Portfolio>): Promise<Portfolio | undefined>;

  // Trades
  createTrade(trade: InsertTrade): Promise<Trade>;
  getRecentTrades(marketId: string, limit?: number): Promise<Trade[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private markets: Map<string, CommodityMarket>;
  private prices: Map<string, Price>;
  private orders: Map<string, Order>;
  private positions: Map<string, Position>;
  private portfolios: Map<string, Portfolio>;
  private trades: Map<string, Trade>;

  constructor() {
    this.users = new Map();
    this.markets = new Map();
    this.prices = new Map();
    this.orders = new Map();
    this.positions = new Map();
    this.portfolios = new Map();
    this.trades = new Map();

    // Initialize with sample markets and prices
    this.initializeData();
  }

  private initializeData() {
    // Create sample markets
    const sampleMarkets: InsertCommodityMarket[] = [
      {
        symbol: "XAU-PERP",
        name: "Gold Perpetual",
        commodityType: CommodityType.GOLD,
        category: CommodityCategory.PRECIOUS_METALS,
        marketType: MarketType.PERPETUAL,
        contractSize: "1",
        tickSize: "0.01",
        maxLeverage: 50,
        marginRequirement: "0.02",
        metadata: { icon: "fas fa-coins", color: "#FFD700" }
      },
      {
        symbol: "XAG-PERP", 
        name: "Silver Perpetual",
        commodityType: CommodityType.SILVER,
        category: CommodityCategory.PRECIOUS_METALS,
        marketType: MarketType.PERPETUAL,
        contractSize: "1",
        tickSize: "0.001",
        maxLeverage: 50,
        marginRequirement: "0.025",
        metadata: { icon: "fas fa-coins", color: "#C0C0C0" }
      },
      {
        symbol: "XPT-PERP",
        name: "Platinum Perpetual", 
        commodityType: CommodityType.PLATINUM,
        category: CommodityCategory.PRECIOUS_METALS,
        marketType: MarketType.PERPETUAL,
        contractSize: "1",
        tickSize: "0.01",
        maxLeverage: 50,
        marginRequirement: "0.03",
        metadata: { icon: "fas fa-coins", color: "#E5E4E2" }
      },
      {
        symbol: "CL-PERP",
        name: "Crude Oil WTI Perpetual",
        commodityType: CommodityType.CRUDE_OIL_WTI,
        category: CommodityCategory.ENERGY,
        marketType: MarketType.PERPETUAL,
        contractSize: "1000",
        tickSize: "0.01",
        maxLeverage: 25,
        marginRequirement: "0.04",
        metadata: { icon: "fas fa-fire", color: "#8B4513" }
      },
      {
        symbol: "NG-PERP",
        name: "Natural Gas Perpetual",
        commodityType: CommodityType.NATURAL_GAS,
        category: CommodityCategory.ENERGY,
        marketType: MarketType.PERPETUAL,
        contractSize: "10000",
        tickSize: "0.001",
        maxLeverage: 20,
        marginRequirement: "0.05",
        metadata: { icon: "fas fa-fire", color: "#4169E1" }
      }
    ];

    sampleMarkets.forEach(market => {
      const id = randomUUID();
      const fullMarket: CommodityMarket = { ...market, id, isActive: true };
      this.markets.set(id, fullMarket);

      // Create initial price data
      const basePrice = this.getBasePriceForCommodity(market.commodityType);
      const price: Price = {
        id: randomUUID(),
        marketId: id,
        price: basePrice.toString(),
        volume24h: (Math.random() * 1000000).toFixed(2),
        change24h: ((Math.random() - 0.5) * 0.1).toFixed(4),
        high24h: (basePrice * 1.02).toString(),
        low24h: (basePrice * 0.98).toString(),
        openInterest: (Math.random() * 10000000).toFixed(2),
        fundingRate: (Math.random() * 0.01).toFixed(6),
        indexPrice: basePrice.toString(),
        lastUpdated: new Date()
      };
      this.prices.set(id, price);
    });
  }

  private getBasePriceForCommodity(commodityType: CommodityType): number {
    const basePrices: Record<CommodityType, number> = {
      [CommodityType.GOLD]: 2048.65,
      [CommodityType.SILVER]: 24.38,
      [CommodityType.PLATINUM]: 985.40,
      [CommodityType.PALLADIUM]: 1245.80,
      [CommodityType.RHODIUM]: 4850.00,
      [CommodityType.CRUDE_OIL_WTI]: 78.25,
      [CommodityType.BRENT_CRUDE]: 82.15,
      [CommodityType.NATURAL_GAS]: 3.45,
      [CommodityType.GASOLINE]: 2.85,
      [CommodityType.HEATING_OIL]: 3.12,
      [CommodityType.CORN]: 485.50,
      [CommodityType.WHEAT]: 612.25,
      [CommodityType.SOYBEANS]: 1245.75,
      [CommodityType.SUGAR]: 0.22,
      [CommodityType.COFFEE]: 1.68,
      [CommodityType.COPPER]: 3.85,
      [CommodityType.ALUMINUM]: 2.12,
      [CommodityType.ZINC]: 2.65,
      [CommodityType.NICKEL]: 18.45,
      [CommodityType.LITHIUM]: 15.25
    };
    return basePrices[commodityType] || 100;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);

    // Create initial portfolio
    const portfolio: Portfolio = {
      id: randomUUID(),
      userId: id,
      totalValue: "10000",
      availableBalance: "10000",
      usedMargin: "0", 
      totalPnl: "0",
      riskLevel: "low",
      updatedAt: new Date()
    };
    this.portfolios.set(id, portfolio);

    return user;
  }

  // Market methods
  async getAllMarkets(): Promise<CommodityMarket[]> {
    return Array.from(this.markets.values());
  }

  async getMarketsByCategory(category: string): Promise<CommodityMarket[]> {
    return Array.from(this.markets.values()).filter(market => market.category === category);
  }

  async getMarket(id: string): Promise<CommodityMarket | undefined> {
    return this.markets.get(id);
  }

  async createMarket(insertMarket: InsertCommodityMarket): Promise<CommodityMarket> {
    const id = randomUUID();
    const market: CommodityMarket = { ...insertMarket, id, isActive: true };
    this.markets.set(id, market);
    return market;
  }

  // Price methods
  async getPrice(marketId: string): Promise<Price | undefined> {
    return this.prices.get(marketId);
  }

  async getAllPrices(): Promise<Price[]> {
    return Array.from(this.prices.values());
  }

  async updatePrice(marketId: string, priceUpdate: Partial<Price>): Promise<Price | undefined> {
    const existing = this.prices.get(marketId);
    if (!existing) return undefined;

    const updated: Price = {
      ...existing,
      ...priceUpdate,
      lastUpdated: new Date()
    };
    this.prices.set(marketId, updated);
    return updated;
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      filledSize: "0",
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async updateOrderStatus(id: string, status: OrderStatus, filledSize?: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updated: Order = {
      ...order,
      status,
      filledSize: filledSize || order.filledSize,
      updatedAt: new Date()
    };
    this.orders.set(id, updated);
    return updated;
  }

  // Position methods
  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const id = randomUUID();
    const position: Position = {
      ...insertPosition,
      id,
      unrealizedPnl: "0",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.positions.set(id, position);
    return position;
  }

  async getUserPositions(userId: string): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(position => position.userId === userId);
  }

  async getPosition(userId: string, marketId: string): Promise<Position | undefined> {
    return Array.from(this.positions.values()).find(
      position => position.userId === userId && position.marketId === marketId
    );
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<Position | undefined> {
    const position = this.positions.get(id);
    if (!position) return undefined;

    const updated: Position = {
      ...position,
      ...updates,
      updatedAt: new Date()
    };
    this.positions.set(id, updated);
    return updated;
  }

  async closePosition(id: string): Promise<boolean> {
    return this.positions.delete(id);
  }

  // Portfolio methods
  async getPortfolio(userId: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(userId);
  }

  async updatePortfolio(userId: string, updates: Partial<Portfolio>): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(userId);
    if (!portfolio) return undefined;

    const updated: Portfolio = {
      ...portfolio,
      ...updates,
      updatedAt: new Date()
    };
    this.portfolios.set(userId, updated);
    return updated;
  }

  // Trade methods
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = randomUUID();
    const trade: Trade = {
      ...insertTrade,
      id,
      timestamp: new Date()
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getRecentTrades(marketId: string, limit: number = 50): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.marketId === marketId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
