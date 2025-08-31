import { apiRequest } from './queryClient';
import type { 
  CommodityMarket, 
  Price, 
  Order, 
  Position, 
  Portfolio, 
  Trade,
  InsertOrder,
  OrderType,
  OrderSide
} from '@shared/schema';

export const tradingApi = {
  // Markets
  getMarkets: async (): Promise<CommodityMarket[]> => {
    const response = await apiRequest('GET', '/api/markets');
    return response.json();
  },

  getMarketsByCategory: async (category: string): Promise<CommodityMarket[]> => {
    const response = await apiRequest('GET', `/api/markets/category/${category}`);
    return response.json();
  },

  getMarket: async (id: string): Promise<CommodityMarket> => {
    const response = await apiRequest('GET', `/api/markets/${id}`);
    return response.json();
  },

  // Prices
  getPrices: async (): Promise<Price[]> => {
    const response = await apiRequest('GET', '/api/prices');
    return response.json();
  },

  getPrice: async (marketId: string): Promise<Price> => {
    const response = await apiRequest('GET', `/api/prices/${marketId}`);
    return response.json();
  },

  // Orders
  placeOrder: async (order: InsertOrder): Promise<Order> => {
    const response = await apiRequest('POST', '/api/orders', order);
    return response.json();
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const response = await apiRequest('GET', `/api/orders/${userId}`);
    return response.json();
  },

  // Positions
  getUserPositions: async (userId: string): Promise<Position[]> => {
    const response = await apiRequest('GET', `/api/positions/${userId}`);
    return response.json();
  },

  closePosition: async (positionId: string): Promise<void> => {
    await apiRequest('DELETE', `/api/positions/${positionId}`);
  },

  // Portfolio
  getPortfolio: async (userId: string): Promise<Portfolio> => {
    const response = await apiRequest('GET', `/api/portfolio/${userId}`);
    return response.json();
  },

  // Trades
  getRecentTrades: async (marketId: string, limit?: number): Promise<Trade[]> => {
    const url = `/api/trades/${marketId}${limit ? `?limit=${limit}` : ''}`;
    const response = await apiRequest('GET', url);
    return response.json();
  }
};

export const calculateLiquidationPrice = (
  entryPrice: number,
  leverage: number,
  side: 'long' | 'short'
): number => {
  const maintenanceMarginRate = 0.005; // 0.5%
  
  if (side === 'long') {
    return entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
  } else {
    return entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
  }
};

export const calculateMargin = (
  size: number,
  price: number,
  leverage: number
): number => {
  return (size * price) / leverage;
};

export const calculatePnL = (
  entryPrice: number,
  markPrice: number,
  size: number,
  side: 'long' | 'short'
): number => {
  if (side === 'long') {
    return (markPrice - entryPrice) * size;
  } else {
    return (entryPrice - markPrice) * size;
  }
};

export const formatPrice = (price: string | number, decimals: number = 2): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toFixed(decimals);
};

export const formatPercent = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};
