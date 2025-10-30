import type { Request, Response } from "express";
import { storage } from "./storage";

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      responseTime?: number;
    };
  };
}

// Detailed health check
export async function healthCheck(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  try {
    // Check database connectivity
    const dbStart = Date.now();
    try {
      await storage.getAllMarkets();
      health.checks.database = {
        status: 'pass',
        responseTime: Date.now() - dbStart
      };
    } catch (error) {
      health.checks.database = {
        status: 'fail',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - dbStart
      };
      health.status = 'unhealthy';
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const maxMemoryMB = 1024; // 1GB limit

    if (memoryUsageMB > maxMemoryMB * 0.9) {
      health.checks.memory = {
        status: 'warn',
        message: `High memory usage: ${memoryUsageMB}MB (${Math.round((memoryUsageMB / maxMemoryMB) * 100)}%)`
      };
      if (health.status === 'healthy') health.status = 'degraded';
    } else if (memoryUsageMB > maxMemoryMB) {
      health.checks.memory = {
        status: 'fail',
        message: `Critical memory usage: ${memoryUsageMB}MB (${Math.round((memoryUsageMB / maxMemoryMB) * 100)}%)`
      };
      health.status = 'unhealthy';
    } else {
      health.checks.memory = {
        status: 'pass',
        message: `Memory usage: ${memoryUsageMB}MB (${Math.round((memoryUsageMB / maxMemoryMB) * 100)}%)`
      };
    }

    // Check WebSocket connections (if available)
    const wsConnections = (global as any).wsConnections || 0;
    health.checks.websocket = {
      status: 'pass',
      message: `${wsConnections} active connections`
    };

    // Check response time
    const responseTime = Date.now() - startTime;
    if (responseTime > 5000) {
      health.checks.responseTime = {
        status: 'warn',
        message: `Slow response time: ${responseTime}ms`,
        responseTime
      };
      if (health.status === 'healthy') health.status = 'degraded';
    } else {
      health.checks.responseTime = {
        status: 'pass',
        responseTime
      };
    }

    // Set HTTP status based on health
    let httpStatus = 200;
    if (health.status === 'degraded') httpStatus = 200; // Still OK but with warnings
    if (health.status === 'unhealthy') httpStatus = 503; // Service Unavailable

    res.status(httpStatus).json(health);

  } catch (error) {
    health.status = 'unhealthy';
    health.checks.general = {
      status: 'fail',
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };

    res.status(503).json(health);
  }
}

// Simple health check for load balancers
export function simpleHealthCheck(req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

// Readiness check (is the service ready to accept traffic?)
export async function readinessCheck(req: Request, res: Response): Promise<void> {
  try {
    // Check if critical services are available
    await storage.getAllMarkets();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Liveness check (is the service alive?)
export function livenessCheck(req: Request, res: Response): void {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime()
  });
}

// Version info
export function versionInfo(req: Request, res: Response): void {
  res.json({
    name: 'Vector Protocol',
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}