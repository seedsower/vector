import { WebSocketServer } from "ws";
import { log } from "./vite";

export interface CleanupManager {
  addCleanupHandler(handler: () => Promise<void> | void): void;
  shutdown(): Promise<void>;
}

class GracefulShutdownManager implements CleanupManager {
  private cleanupHandlers: Array<() => Promise<void> | void> = [];
  private isShuttingDown = false;
  private shutdownTimeout = 10000; // 10 seconds

  constructor() {
    // Register signal handlers
    process.on('SIGTERM', this.handleShutdown.bind(this));
    process.on('SIGINT', this.handleShutdown.bind(this));
    process.on('SIGUSR2', this.handleShutdown.bind(this)); // nodemon restart

    // Handle uncaught exceptions gracefully
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  addCleanupHandler(handler: () => Promise<void> | void): void {
    this.cleanupHandlers.push(handler);
  }

  private async handleShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      log(`Already shutting down, ignoring ${signal}`, "cleanup");
      return;
    }

    this.isShuttingDown = true;
    log(`Received ${signal}, starting graceful shutdown...`, "cleanup");

    try {
      await this.shutdown();
      log("Graceful shutdown completed", "cleanup");
      process.exit(0);
    } catch (error) {
      log(`Error during shutdown: ${error}`, "cleanup");
      process.exit(1);
    }
  }

  private handleUncaughtException(error: Error): void {
    log(`Uncaught Exception: ${error.message}`, "cleanup");
    console.error(error.stack);

    // Don't exit immediately, try graceful shutdown first
    setTimeout(() => {
      this.handleShutdown('UNCAUGHT_EXCEPTION').catch(() => {
        process.exit(1);
      });
    }, 100);
  }

  private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, "cleanup");

    // Log but don't crash - in web3 apps, some promises might reject due to network issues
    if (process.env.NODE_ENV === 'development') {
      console.warn('Unhandled Promise Rejection - this should be investigated');
    }
  }

  async shutdown(): Promise<void> {
    const shutdownPromise = this.executeCleanup();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Shutdown timeout')), this.shutdownTimeout);
    });

    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
    } catch (error) {
      log(`Shutdown timeout or error: ${error}`, "cleanup");
      throw error;
    }
  }

  private async executeCleanup(): Promise<void> {
    log(`Running ${this.cleanupHandlers.length} cleanup handlers...`, "cleanup");

    const cleanupPromises = this.cleanupHandlers.map(async (handler, index) => {
      try {
        await handler();
        log(`Cleanup handler ${index + 1} completed`, "cleanup");
      } catch (error) {
        log(`Cleanup handler ${index + 1} failed: ${error}`, "cleanup");
      }
    });

    await Promise.allSettled(cleanupPromises);
  }
}

// WebSocket cleanup helper
export function createWebSocketCleanup(wss: WebSocketServer): () => Promise<void> {
  return async () => {
    log("Closing WebSocket connections...", "cleanup");

    // Close all client connections
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.close(1001, 'Server shutting down');
      }
    });

    // Close the server
    return new Promise<void>((resolve) => {
      wss.close(() => {
        log("WebSocket server closed", "cleanup");
        resolve();
      });
    });
  };
}

// HTTP server cleanup helper
export function createHttpServerCleanup(server: any): () => Promise<void> {
  return async () => {
    log("Closing HTTP server...", "cleanup");

    return new Promise<void>((resolve, reject) => {
      server.close((error: Error | undefined) => {
        if (error) {
          log(`Error closing HTTP server: ${error}`, "cleanup");
          reject(error);
        } else {
          log("HTTP server closed", "cleanup");
          resolve();
        }
      });
    });
  };
}

// Database cleanup helper (for future use)
export function createDatabaseCleanup(): () => Promise<void> {
  return async () => {
    log("Closing database connections...", "cleanup");
    // Add database cleanup logic here when needed
    // For example: await db.close();
    log("Database connections closed", "cleanup");
  };
}

// Memory cleanup helper
export function createMemoryCleanup(): () => Promise<void> {
  return async () => {
    log("Running memory cleanup...", "cleanup");

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      log("Garbage collection completed", "cleanup");
    }

    // Clear any large objects or caches
    // This is where you'd clean up any in-memory stores or caches
  };
}

// Export singleton instance
export const cleanupManager = new GracefulShutdownManager();

// Web3 specific cleanup helper
export function createWeb3Cleanup(): () => Promise<void> {
  return async () => {
    log("Cleaning up Web3 connections...", "cleanup");

    // Close Solana RPC connections
    // Close WebSocket subscriptions
    // Clean up any pending transactions

    log("Web3 cleanup completed", "cleanup");
  };
}