import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { oracleAggregator } from "./oracle";
import { marketMakerProgram } from "./market-maker";
import { analytics } from "./analytics";
import { insertOrderSchema, insertPositionSchema, type WebSocketMessage, type PriceUpdate, type OrderUpdate, type MarketMakerUpdate, OrderStatus } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedClients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  function broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Enhanced price simulation with oracle aggregation
  setInterval(async () => {
    const markets = await storage.getAllMarkets();
    for (const market of markets) {
      const currentPrice = await storage.getPrice(market.id);
      if (currentPrice) {
        try {
          // Get aggregated price from oracle system
          const aggregatedPrice = await oracleAggregator.getAggregatedPrice(market.commodityType as any);
          const change = (Math.random() - 0.5) * 0.02; // ±2% max change
          const basePrice = parseFloat(aggregatedPrice.price);
          const newPrice = basePrice * (1 + change);
          const changePercent = (change * 100).toFixed(4);

          await storage.updatePrice(market.id, {
            price: newPrice.toFixed(8),
            change24h: changePercent,
            volume24h: (parseFloat(currentPrice.volume24h) + Math.random() * 100000).toFixed(2)
          });

          const priceUpdate: PriceUpdate = {
            type: 'price_update',
            marketId: market.id,
            price: newPrice.toFixed(8),
            change24h: changePercent,
            volume24h: currentPrice.volume24h,
            timestamp: Date.now(),
            aggregatedData: aggregatedPrice
          };

          broadcast(priceUpdate);
        } catch (error) {
          // Fallback to simple price simulation if oracle fails
          const change = (Math.random() - 0.5) * 0.02;
          const newPrice = parseFloat(currentPrice.price) * (1 + change);
          const changePercent = (change * 100).toFixed(4);

          await storage.updatePrice(market.id, {
            price: newPrice.toFixed(8),
            change24h: changePercent
          });

          const priceUpdate: PriceUpdate = {
            type: 'price_update',
            marketId: market.id,
            price: newPrice.toFixed(8),
            change24h: changePercent,
            volume24h: currentPrice.volume24h,
            timestamp: Date.now()
          };

          broadcast(priceUpdate);
        }
      }
    }
  }, 3000);

  // Market maker stats update simulation
  setInterval(async () => {
    const demoUserId = "demo-user";
    const volume = Math.random() * 10000;
    const depthContribution = Math.random() * 10;
    const uptimePercentage = 95 + Math.random() * 5;
    
    const stats = await marketMakerProgram.updateMakerStats(
      demoUserId,
      volume,
      depthContribution,
      uptimePercentage
    );
    
    const rebates = await marketMakerProgram.calculateRebates(
      demoUserId,
      "GOLD" as any,
      volume
    );
    
    const marketMakerUpdate: MarketMakerUpdate = {
      type: 'market_maker_update',
      userId: demoUserId,
      stats,
      rebates
    };
    
    broadcast(marketMakerUpdate);
  }, 10000);

  // Markets API
  app.get("/api/markets", async (req, res) => {
    try {
      const markets = await storage.getAllMarkets();
      res.json(markets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  app.get("/api/markets/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const markets = await storage.getMarketsByCategory(category);
      res.json(markets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch markets by category" });
    }
  });

  app.get("/api/markets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const market = await storage.getMarket(id);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      res.json(market);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market" });
    }
  });

  // Prices API
  app.get("/api/prices", async (req, res) => {
    try {
      const prices = await storage.getAllPrices();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prices" });
    }
  });

  app.get("/api/prices/:marketId", async (req, res) => {
    try {
      const { marketId } = req.params;
      const price = await storage.getPrice(marketId);
      if (!price) {
        return res.status(404).json({ message: "Price not found" });
      }
      res.json(price);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price" });
    }
  });

  // Orders API
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // For demo purposes, use a default user ID
      const userId = "demo-user";
      
      const order = await storage.createOrder({
        ...orderData,
        userId
      });

      // Simulate order execution for market orders
      if (orderData.orderType === "market") {
        const updatedOrder = await storage.updateOrderStatus(order.id, OrderStatus.FILLED, orderData.size);
        
        const orderUpdate: OrderUpdate = {
          type: 'order_update',
          orderId: order.id,
          status: OrderStatus.FILLED,
          filledSize: orderData.size
        };
        broadcast(orderUpdate);

        // Create position if it doesn't exist
        const existingPosition = await storage.getPosition(userId, orderData.marketId);
        if (!existingPosition && orderData.leverage && orderData.leverage > 1) {
          const market = await storage.getMarket(orderData.marketId);
          const price = await storage.getPrice(orderData.marketId);
          
          if (market && price) {
            const margin = (parseFloat(orderData.size) * parseFloat(price.price)) / orderData.leverage;
            const liquidationPrice = orderData.side === "buy" 
              ? parseFloat(price.price) * (1 - 1/orderData.leverage * 0.9)
              : parseFloat(price.price) * (1 + 1/orderData.leverage * 0.9);

            await storage.createPosition({
              userId,
              marketId: orderData.marketId,
              side: orderData.side === "buy" ? "long" : "short",
              size: orderData.size,
              entryPrice: price.price,
              markPrice: price.price,
              leverage: orderData.leverage,
              margin: margin.toString(),
              liquidationPrice: liquidationPrice.toString()
            });
          }
        }

        res.json(updatedOrder);
      } else {
        res.json(order);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Positions API
  app.get("/api/positions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const positions = await storage.getUserPositions(userId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.closePosition(id);
      if (!success) {
        return res.status(404).json({ message: "Position not found" });
      }
      res.json({ message: "Position closed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to close position" });
    }
  });

  // Portfolio API
  app.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const portfolio = await storage.getPortfolio(userId);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Trades API
  app.get("/api/trades/:marketId", async (req, res) => {
    try {
      const { marketId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const trades = await storage.getRecentTrades(marketId, limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Oracle API
  app.get("/api/oracle/health", async (req, res) => {
    try {
      const health = oracleAggregator.getOracleHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch oracle health" });
    }
  });

  app.get("/api/oracle/price/:commodity", async (req, res) => {
    try {
      const { commodity } = req.params;
      const aggregatedPrice = await oracleAggregator.getAggregatedPrice(commodity as any);
      res.json(aggregatedPrice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch aggregated price" });
    }
  });

  // Market Maker API
  app.get("/api/market-maker/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await marketMakerProgram.getMakerStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market maker stats" });
    }
  });

  app.get("/api/market-maker/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = marketMakerProgram.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/market-maker/rebates", async (req, res) => {
    try {
      const { userId, commodityType, volume } = req.body;
      const rebates = await marketMakerProgram.calculateRebates(userId, commodityType, volume);
      res.json(rebates);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate rebates" });
    }
  });

  // Analytics API
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const overview = await analytics.getOverviewMetrics();
      res.json(overview);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch overview metrics" });
    }
  });

  app.get("/api/analytics/commodities", async (req, res) => {
    try {
      const commodities = await analytics.getCommodityMetrics();
      res.json(commodities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commodity metrics" });
    }
  });

  app.get("/api/analytics/volumes", async (req, res) => {
    try {
      const volumes = await analytics.getVolumeMetrics();
      res.json(volumes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch volume metrics" });
    }
  });

  app.get("/api/analytics/portfolio/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const portfolioAnalytics = await analytics.getPortfolioAnalytics(userId);
      res.json(portfolioAnalytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio analytics" });
    }
  });

  app.get("/api/analytics/full", async (req, res) => {
    try {
      const fullAnalytics = await analytics.getFullAnalytics();
      res.json(fullAnalytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch full analytics" });
    }
  });

  return httpServer;
}
