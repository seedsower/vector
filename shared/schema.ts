import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export enum CommodityType {
  // Precious Metals (10)
  GOLD = "XAU",
  SILVER = "XAG", 
  PLATINUM = "XPT",
  PALLADIUM = "XPD",
  RHODIUM = "XRH",
  IRIDIUM = "XIR",
  RUTHENIUM = "XRU",
  OSMIUM = "XOS",
  RHENIUM = "XRE",
  INDIUM = "XIN",
  
  // Energy (10)
  CRUDE_OIL_WTI = "CL",
  BRENT_CRUDE = "BZ",
  NATURAL_GAS = "NG",
  GASOLINE = "RB",
  HEATING_OIL = "HO",
  COAL = "COAL",
  URANIUM = "UX",
  ETHANOL = "EH",
  PROPANE = "PRO",
  ELECTRICITY = "ELEC",
  
  // Agricultural (10)
  CORN = "ZC",
  WHEAT = "ZW",
  SOYBEANS = "ZS",
  SUGAR = "SB",
  COFFEE = "KC",
  COCOA = "CC",
  COTTON = "CT",
  RICE = "ZR",
  CATTLE = "LE",
  LEAN_HOGS = "HE",
  
  // Industrial Metals (10)
  COPPER = "HG",
  ALUMINUM = "ALI",
  ZINC = "ZNC",
  NICKEL = "NIC",
  LEAD = "LED",
  TIN = "TIN",
  IRON_ORE = "FE",
  STEEL = "STL",
  LITHIUM = "LIT",
  COBALT = "COB"
}

export enum CommodityCategory {
  PRECIOUS_METALS = "precious_metals",
  ENERGY = "energy", 
  AGRICULTURE = "agriculture",
  INDUSTRIAL_METALS = "industrial_metals"
}

export enum MarketType {
  SPOT = "spot",
  PERPETUAL = "perpetual"
}

export enum OrderType {
  MARKET = "market",
  LIMIT = "limit",
  STOP = "stop",
  STOP_LIMIT = "stop_limit",
  TRAILING_STOP = "trailing_stop",
  ICEBERG = "iceberg",
  TWAP = "twap",
  BRACKET = "bracket"
}

export enum OrderSide {
  BUY = "buy",
  SELL = "sell"
}

export enum OrderStatus {
  PENDING = "pending",
  FILLED = "filled",
  CANCELLED = "cancelled",
  PARTIALLY_FILLED = "partially_filled"
}

export enum PositionSide {
  LONG = "long",
  SHORT = "short"
}

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commodityMarkets = pgTable("commodity_markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  commodityType: text("commodity_type").notNull(),
  category: text("category").notNull(),
  marketType: text("market_type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  contractSize: decimal("contract_size", { precision: 18, scale: 8 }).notNull(),
  tickSize: decimal("tick_size", { precision: 18, scale: 8 }).notNull(),
  maxLeverage: integer("max_leverage").default(50).notNull(),
  marginRequirement: decimal("margin_requirement", { precision: 5, scale: 4 }).notNull(),
  metadata: jsonb("metadata"),
});

export const prices = pgTable("prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => commodityMarkets.id),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  volume24h: decimal("volume_24h", { precision: 18, scale: 8 }).default("0").notNull(),
  change24h: decimal("change_24h", { precision: 5, scale: 4 }).default("0").notNull(),
  high24h: decimal("high_24h", { precision: 18, scale: 8 }).notNull(),
  low24h: decimal("low_24h", { precision: 18, scale: 8 }).notNull(),
  openInterest: decimal("open_interest", { precision: 18, scale: 8 }).default("0").notNull(),
  fundingRate: decimal("funding_rate", { precision: 8, scale: 6 }).default("0").notNull(),
  indexPrice: decimal("index_price", { precision: 18, scale: 8 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  marketId: varchar("market_id").notNull().references(() => commodityMarkets.id),
  orderType: text("order_type").notNull(),
  side: text("side").notNull(),
  size: decimal("size", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }),
  filledSize: decimal("filled_size", { precision: 18, scale: 8 }).default("0").notNull(),
  status: text("status").default("pending").notNull(),
  leverage: integer("leverage").default(1).notNull(),
  reduceOnly: boolean("reduce_only").default(false).notNull(),
  postOnly: boolean("post_only").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  marketId: varchar("market_id").notNull().references(() => commodityMarkets.id),
  side: text("side").notNull(),
  size: decimal("size", { precision: 18, scale: 8 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 18, scale: 8 }).notNull(),
  markPrice: decimal("mark_price", { precision: 18, scale: 8 }).notNull(),
  leverage: integer("leverage").notNull(),
  margin: decimal("margin", { precision: 18, scale: 8 }).notNull(),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 18, scale: 8 }).default("0").notNull(),
  liquidationPrice: decimal("liquidation_price", { precision: 18, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  totalValue: decimal("total_value", { precision: 18, scale: 8 }).default("0").notNull(),
  availableBalance: decimal("available_balance", { precision: 18, scale: 8 }).default("10000").notNull(),
  usedMargin: decimal("used_margin", { precision: 18, scale: 8 }).default("0").notNull(),
  totalPnl: decimal("total_pnl", { precision: 18, scale: 8 }).default("0").notNull(),
  riskLevel: text("risk_level").default("low").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => commodityMarkets.id),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  size: decimal("size", { precision: 18, scale: 8 }).notNull(),
  side: text("side").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCommodityMarketSchema = createInsertSchema(commodityMarkets).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  filledSize: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  unrealizedPnl: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CommodityMarket = typeof commodityMarkets.$inferSelect;
export type InsertCommodityMarket = z.infer<typeof insertCommodityMarketSchema>;

export type Price = typeof prices.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Portfolio = typeof portfolios.$inferSelect;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

// Risk Management
export interface RiskParameters {
  maxPositionSize: string;
  maxLeverage: number;
  marginCallThreshold: string;
  liquidationThreshold: string;
  dailyLossLimit: string;
  maxOpenOrders: number;
}

export interface LiquidationData {
  positionId: string;
  liquidationPrice: string;
  currentPrice: string;
  healthFactor: string;
  timeToLiquidation: number;
}

// Oracle and Price Aggregation
export interface OracleSource {
  name: string;
  endpoint: string;
  weight: number;
  isActive: boolean;
  confidence: number;
}

export interface AggregatedPrice {
  price: string;
  confidence: number;
  sources: OracleSource[];
  timestamp: number;
  deviation: string;
}

// Market Maker Incentives
export interface MarketMakerStats {
  userId: string;
  volume30d: string;
  depthScore: number;
  uptimeScore: number;
  tier: string;
}

export interface RebateCalculation {
  baseRebate: number;
  volumeBonus: number;
  depthBonus: number;
  commodityMultiplier: number;
  totalRebate: number;
  vectorTokenRewards: string;
}

// WebSocket message types
export interface PriceUpdate {
  type: 'price_update';
  marketId: string;
  price: string;
  change24h: string;
  volume24h: string;
  timestamp: number;
  aggregatedData?: AggregatedPrice;
}

export interface OrderUpdate {
  type: 'order_update';
  orderId: string;
  status: OrderStatus;
  filledSize: string;
  averagePrice?: string;
}

export interface TradeUpdate {
  type: 'trade_update';
  marketId: string;
  trade: Trade;
}

export interface LiquidationAlert {
  type: 'liquidation_alert';
  positionId: string;
  data: LiquidationData;
}

export interface MarketMakerUpdate {
  type: 'market_maker_update';
  userId: string;
  stats: MarketMakerStats;
  rebates: RebateCalculation;
}

export type WebSocketMessage = PriceUpdate | OrderUpdate | TradeUpdate | LiquidationAlert | MarketMakerUpdate;
