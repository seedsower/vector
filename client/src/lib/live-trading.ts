import "./solana-polyfills";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import { VectorProtocolClient, OrderType, PositionDirection } from "@/solana/vector-protocol";
import { BN } from "@coral-xyz/anchor";

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
      const orderType = order.orderType === 'market' ? OrderType.Market : OrderType.Limit;
      const direction = order.side === 'buy' ? PositionDirection.Long : PositionDirection.Short;
      const baseAssetAmount = new BN(order.size * 1e6); // Convert to base units
      const price = new BN((order.price || 0) * 1e6);

      // Use the existing placePerpOrder method
      const signature = await this.vectorClient.placePerpOrder(
        new Keypair(), // This should be the user's keypair
        orderType,
        0, // market index
        baseAssetAmount,
        price,
        direction
      );
      
      return signature;
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<string> {
    // Placeholder for cancel order functionality
    console.log('Cancel order not yet implemented:', orderId);
    return 'cancel-placeholder';
  }

  async closePosition(marketId: string): Promise<string> {
    // Placeholder for close position functionality
    console.log('Close position not yet implemented:', marketId);
    return 'close-placeholder';
  }

  async getPositions(): Promise<Position[]> {
    if (!this.vectorClient) {
      throw new Error('Vector client not initialized');
    }

    try {
      // Get all users and filter by connected wallet
      const users = await this.vectorClient.getAllUsers();
      // Return empty array for now, this would need to be implemented based on the actual user account structure
      return [];
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  async getOrders(): Promise<any[]> {
    // Placeholder for get orders functionality
    return [];
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