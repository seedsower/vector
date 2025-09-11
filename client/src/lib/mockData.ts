import type { CommodityMarket, Price, Trade, Order, Position, Portfolio } from '@shared/schema';

export const mockMarkets: CommodityMarket[] = [
  {
    id: "gold-perp",
    symbol: "GOLD-PERP",
    name: "Gold Perpetual",
    commodityType: "XAU",
    category: "metals",
    marketType: "perpetual",
    isActive: true,
    contractSize: "1.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "silver-perp",
    symbol: "SILVER-PERP",
    name: "Silver Perpetual",
    commodityType: "XAG",
    category: "metals",
    marketType: "perpetual",
    isActive: true,
    contractSize: "10.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "oil-perp",
    symbol: "OIL-PERP",
    name: "Oil Perpetual",
    commodityType: "CL",
    category: "energy",
    marketType: "perpetual",
    isActive: true,
    contractSize: "1.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "wheat-perp",
    symbol: "WHEAT-PERP",
    name: "Wheat Perpetual",
    commodityType: "ZW",
    category: "agriculture",
    marketType: "perpetual",
    isActive: true,
    contractSize: "100.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  }
];

export const mockPrices: Price[] = [
  {
    id: "gold-price",
    marketId: "gold-perp",
    price: "2045.50",
    volume24h: "1250000",
    change24h: "0.0061",
    high24h: "2055.80",
    low24h: "2032.10",
    openInterest: "500000",
    fundingRate: "0.0001",
    indexPrice: "2045.30",
    lastUpdated: new Date()
  },
  {
    id: "silver-price",
    marketId: "silver-perp",
    price: "24.85",
    volume24h: "850000",
    change24h: "-0.0178",
    high24h: "25.40",
    low24h: "24.70",
    openInterest: "200000",
    fundingRate: "0.0001",
    indexPrice: "24.83",
    lastUpdated: new Date()
  },
  {
    id: "oil-price",
    marketId: "oil-perp",
    price: "78.95",
    volume24h: "2100000",
    change24h: "0.0280",
    high24h: "79.50",
    low24h: "76.20",
    openInterest: "800000",
    fundingRate: "0.0001",
    indexPrice: "78.92",
    lastUpdated: new Date()
  },
  {
    id: "wheat-price",
    marketId: "wheat-perp",
    price: "6.45",
    volume24h: "420000",
    change24h: "0.0126",
    high24h: "6.52",
    low24h: "6.35",
    openInterest: "150000",
    fundingRate: "0.0001",
    indexPrice: "6.44",
    lastUpdated: new Date()
  }
];

export const mockTrades: Trade[] = [
  {
    id: "trade-1",
    marketId: "gold-perp",
    price: "2045.50",
    size: "2.5",
    side: "buy",
    timestamp: new Date(Date.now() - 30000)
  },
  {
    id: "trade-2",
    marketId: "gold-perp",
    price: "2044.80",
    size: "1.2",
    side: "sell",
    timestamp: new Date(Date.now() - 60000)
  }
];

export const mockPositions: Position[] = [
  {
    id: "pos-1",
    userId: "demo-user",
    marketId: "gold-perp",
    side: "long",
    size: "5.0",
    entryPrice: "2040.00",
    markPrice: "2045.50",
    unrealizedPnl: "27.50",
    leverage: 10,
    margin: "1020.00",
    liquidationPrice: "1836.00",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockPortfolio: Portfolio = {
  id: "portfolio-1",
  userId: "demo-user",
  totalValue: "50000.00",
  availableBalance: "45000.00",
  usedMargin: "5000.00",
  totalPnl: "127.50",
  riskLevel: "low",
  updatedAt: new Date()
};

export const mockAnalytics = {
  totalVolume: "4620000",
  totalTrades: 15420,
  activeMarkets: 4,
  totalUsers: 1250,
  volumeChange24h: 8.5,
  tradesChange24h: 12.3,
  marketData: [
    { name: "Gold", volume: "1250000", trades: 5200 },
    { name: "Oil", volume: "2100000", trades: 7800 },
    { name: "Silver", volume: "850000", trades: 1920 },
    { name: "Wheat", volume: "420000", trades: 500 }
  ]
};

export const mockOracleHealth = {
  status: "healthy",
  lastUpdate: new Date(),
  priceFeeds: 4,
  healthyFeeds: 4,
  avgLatency: 250
};
