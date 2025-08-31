import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@/contexts/WalletContext";
import { VectorProtocolClient } from "@/solana/vector-protocol";

export interface OrderRequest {
  marketId: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop' | 'stop-limit';
  size: number;
  price?: number;
  stopPrice?: number;
  timeInForce: 'GTC' | 'IOC' | 'FOK';
}

export interface Position {
  marketId: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  unrealizedPnl: number;
  liquidationPrice: number;
}

export class LiveTradingClient {
  private connection: Connection;
  private vectorClient: VectorProtocolClient | null = null;

  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  async initialize(wallet: any) {
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    this.vectorClient = new VectorProtocolClient(
      this.connection,
      wallet
    );

    return this.vectorClient;
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  async placeOrder(order: OrderRequest): Promise<string> {
    if (!this.vectorClient) {
      throw new Error('Vector client not initialized');
    }

    try {
      // Convert order details to Vector Protocol format
      const orderData = {
        market: order.marketId,
        orderType: order.orderType,
        direction: order.side === 'buy' ? 'long' : 'short',
        baseAssetAmount: order.size,
        price: order.price,
        stopPrice: order.stopPrice,
        timeInForce: order.timeInForce,
      };

      const signature = await this.vectorClient.placeOrder(orderData);
      return signature;
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<string> {
    if (!this.vectorClient) {
      throw new Error('Vector client not initialized');
    }

    try {
      const signature = await this.vectorClient.cancelOrder(orderId);
      return signature;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
  }

  async closePosition(marketId: string): Promise<string> {
    if (!this.vectorClient) {
      throw new Error('Vector client not initialized');
    }

    try {
      const signature = await this.vectorClient.closePosition(marketId);
      return signature;
    } catch (error) {
      console.error('Failed to close position:', error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    if (!this.vectorClient) {
      throw new Error('Vector client not initialized');
    }

    try {
      const positions = await this.vectorClient.getPositions();
      return positions.map((position: any) => ({
        marketId: position.market,
        side: position.direction === 'long' ? 'long' : 'short',
        size: position.baseAssetAmount,
        entryPrice: position.averageEntryPrice,
        unrealizedPnl: position.unrealizedPnl,
        liquidationPrice: position.liquidationPrice,
      }));
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  async getOrders(): Promise<any[]> {
    if (!this.vectorClient) {
      throw new Error('Vector client not initialized');
    }

    try {
      return await this.vectorClient.getOrders();
    } catch (error) {
      console.error('Failed to get orders:', error);
      return [];
    }
  }

  async subscribeToMarketData(marketId: string, callback: (data: any) => void) {
    // Set up WebSocket subscription for real-time market data
    const wsUrl = 'wss://api.devnet.solana.com';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'accountSubscribe',
        params: [marketId, { encoding: 'base64' }]
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.params && data.params.result) {
        callback(data.params.result);
      }
    };

    return () => ws.close();
  }
}

export const liveTradingClient = new LiveTradingClient();