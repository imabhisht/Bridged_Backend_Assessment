import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoHealthService {
  private readonly logger = new Logger(MongoHealthService.name);

  constructor(@InjectConnection() private connection: Connection) {
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring(): void {
    // Monitor connection events
    this.connection.on('connected', () => {
      this.logger.log('MongoDB connected successfully');
      this.logConnectionPoolStats();
    });

    this.connection.on('error', (error: any) => {
      this.logger.error('MongoDB connection error:', error);
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });

    this.connection.on('reconnected', () => {
      this.logger.log('MongoDB reconnected');
      this.logConnectionPoolStats();
    });

    // Monitor connection pool events
    this.connection.on('connectionPoolCreated', (event: any) => {
      this.logger.log(`Connection pool created: ${JSON.stringify(event)}`);
    });

    this.connection.on('connectionPoolClosed', (event: any) => {
      this.logger.log(`Connection pool closed: ${JSON.stringify(event)}`);
    });

    this.connection.on('connectionCreated', (event: any) => {
      this.logger.debug(`New connection created: ${event.connectionId}`);
    });

    this.connection.on('connectionClosed', (event: any) => {
      this.logger.debug(`Connection closed: ${event.connectionId}`);
    });

    this.connection.on('connectionCheckOutStarted', (event: any) => {
      this.logger.debug(`Connection checkout started`);
    });

    this.connection.on('connectionCheckOutFailed', (event: any) => {
      this.logger.warn(`Connection checkout failed: ${event.reason}`);
    });

    this.connection.on('connectionCheckedOut', (event: any) => {
      this.logger.debug(`Connection checked out: ${event.connectionId}`);
    });

    this.connection.on('connectionCheckedIn', (event: any) => {
      this.logger.debug(`Connection checked in: ${event.connectionId}`);
    });
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      readyState: number;
      readyStateText: string;
      host: string;
      name: string;
      collections: number;
      connectionPool: any;
    };
  }> {
    try {
      const readyState = this.connection.readyState;
      const readyStateText = this.getReadyStateText(readyState);
      const isHealthy = readyState === 1; // 1 = connected

      // Get basic connection info
      const details = {
        readyState,
        readyStateText,
        host: this.connection.host,
        name: this.connection.name,
        collections: Object.keys(this.connection.collections).length,
        connectionPool: await this.getConnectionPoolStats(),
      };

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details,
      };
    } catch (error) {
      this.logger.error('Error getting health status:', error);
      return {
        status: 'unhealthy',
        details: {
          readyState: -1,
          readyStateText: 'error',
          host: 'unknown',
          name: 'unknown',
          collections: 0,
          connectionPool: null,
        },
      };
    }
  }

  private getReadyStateText(state: number): string {
    const states: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }

  private async getConnectionPoolStats(): Promise<any> {
    try {
      // Access the native MongoDB driver
      const db = this.connection.db;
      if (!db) return null;

      // Get server status for connection pool information
      const adminDb = db.admin();
      const serverStatus = await adminDb.serverStatus();
      
      return {
        connections: serverStatus.connections || {},
        metrics: serverStatus.metrics || {},
        // Additional pool stats if available
        poolSize: serverStatus.connections?.current || 0,
        availableConnections: serverStatus.connections?.available || 0,
        totalCreated: serverStatus.connections?.totalCreated || 0,
      };
    } catch (error) {
      this.logger.warn('Could not get connection pool stats:', (error as Error).message);
      return null;
    }
  }

  private logConnectionPoolStats(): void {
    setTimeout(async () => {
      const stats = await this.getConnectionPoolStats();
      if (stats) {
        this.logger.log(`Connection Pool Stats: ${JSON.stringify(stats.connections, null, 2)}`);
      }
    }, 1000); // Wait a bit for connection to stabilize
  }

  async performHealthCheck(): Promise<boolean> {
    try {
      // Simple ping to check if database is responsive
      if (!this.connection.db) return false;
      await this.connection.db.admin().ping();
      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }

  async getPerformanceMetrics(): Promise<{
    latency: number;
    operations: any;
    connections: any;
  }> {
    try {
      if (!this.connection.db) {
        return {
          latency: -1,
          operations: {},
          connections: {},
        };
      }

      const start = Date.now();
      await this.connection.db.admin().ping();
      const latency = Date.now() - start;

      const serverStatus = await this.connection.db.admin().serverStatus();
      
      return {
        latency,
        operations: {
          insert: serverStatus.opcounters?.insert || 0,
          query: serverStatus.opcounters?.query || 0,
          update: serverStatus.opcounters?.update || 0,
          delete: serverStatus.opcounters?.delete || 0,
        },
        connections: serverStatus.connections || {},
      };
    } catch (error) {
      this.logger.error('Error getting performance metrics:', error);
      return {
        latency: -1,
        operations: {},
        connections: {},
      };
    }
  }
}
