import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

export interface IWebSocketHealthProvider {
  getConnectedUsersCount(): number;
  getTotalConnectionsCount(): number;
}

@Injectable()
export class WebSocketHealthIndicator extends HealthIndicator {
  private wsProvider: IWebSocketHealthProvider | null = null;
  private lazyProvider: (() => IWebSocketHealthProvider | null) | null = null;

  setProvider(provider: IWebSocketHealthProvider): void {
    this.wsProvider = provider;
    this.lazyProvider = null; // Clear lazy provider once direct provider is set
  }

  setLazyProvider(factory: () => IWebSocketHealthProvider | null): void {
    this.lazyProvider = factory;
  }

  /**
   * Check WebSocket server health
   * 
   * @param key - Health indicator key
   * @returns Health check result
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Try lazy provider if direct provider is not set
    if (!this.wsProvider && this.lazyProvider) {
      try {
        this.wsProvider = this.lazyProvider();
        if (this.wsProvider) {
          this.lazyProvider = null; // Clear lazy provider once we have a direct provider
        }
      } catch (error) {
        // Ignore errors from lazy provider
      }
    }

    if (!this.wsProvider) {
      // Return 'up' status but with initialization info
      return this.getStatus(key, true, {
        initialized: false,
        message: 'WebSocket provider not registered',
        connectedUsers: 0,
        totalConnections: 0,
      });
    }

    try {
      const connectedUsers = this.wsProvider.getConnectedUsersCount();
      const totalConnections = this.wsProvider.getTotalConnectionsCount();

      const result = this.getStatus(key, true, {
        initialized: true,
        connectedUsers,
        totalConnections,
        averageConnectionsPerUser: connectedUsers > 0 
          ? (totalConnections / connectedUsers).toFixed(2) 
          : '0',
      });

      return result;
    } catch (error) {
      // Return error status - 'down' for Terminus
      return this.getStatus(key, false, {
        initialized: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}



