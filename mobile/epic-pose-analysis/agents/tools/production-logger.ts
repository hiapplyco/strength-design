/**
 * Production Logger for Mobile App
 * Structured logging with proper levels, context, and remote transmission
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  context: Record<string, any>;
  userId?: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  stackTrace?: string;
}

interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  appVersion: string;
  buildNumber: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  maxLocalLogs: number;
  batchSize: number;
  flushInterval: number;
  remoteEndpoint: string;
  enableConsole: boolean;
}

export class ProductionLogger {
  private static instance: ProductionLogger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private sessionId: string;
  private userId?: string;
  private isOnline: boolean = true;
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = {
      minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
      maxLocalLogs: 1000,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      remoteEndpoint: 'https://api.strength.design/logs',
      enableConsole: __DEV__
    };

    this.sessionId = this.generateSessionId();
    this.initializeNetworkListener();
    this.startFlushTimer();
    this.loadStoredLogs();
  }

  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.flushLogs();
      }
    });
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.isOnline) {
        this.flushLogs();
      }
    }, this.config.flushInterval);
  }

  private async loadStoredLogs() {
    try {
      const stored = await AsyncStorage.getItem('log_buffer');
      if (stored) {
        this.logBuffer = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load stored logs', error);
    }
  }

  /**
   * Set user context for all future logs
   */
  setUser(userId: string) {
    this.userId = userId;
    this.info('User context set', { userId });
  }

  /**
   * Main logging methods - NO FALLBACKS
   */
  debug(message: string, context: Record<string, any> = {}) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context: Record<string, any> = {}) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context: Record<string, any> = {}) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context: Record<string, any> = {}) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }, error?.stack);
  }

  critical(message: string, error?: Error, context: Record<string, any> = {}) {
    this.log(LogLevel.CRITICAL, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }, error?.stack);
    
    // Critical errors trigger immediate flush
    this.flushLogs();
  }

  /**
   * Performance logging
   */
  startTimer(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.info('Performance measurement', {
        label,
        duration,
        unit: 'ms'
      });
      
      // Alert if operation is slow
      if (duration > 1000) {
        this.warn('Slow operation detected', {
          label,
          duration,
          threshold: 1000
        });
      }
    };
  }

  /**
   * Track user actions for analytics
   */
  trackAction(action: string, properties: Record<string, any> = {}) {
    this.info('User action', {
      action,
      properties,
      timestamp: Date.now()
    });
  }

  /**
   * Track API calls
   */
  trackApiCall(
    endpoint: string,
    method: string,
    statusCode?: number,
    duration?: number,
    error?: Error
  ) {
    const level = error || (statusCode && statusCode >= 400) 
      ? LogLevel.ERROR 
      : LogLevel.INFO;
    
    this.log(level, 'API call', {
      endpoint,
      method,
      statusCode,
      duration,
      error: error ? error.message : undefined
    });
  }

  /**
   * Track screen views
   */
  trackScreen(screenName: string, params?: Record<string, any>) {
    this.info('Screen view', {
      screen: screenName,
      params,
      previousScreen: global.previousScreen
    });
    global.previousScreen = screenName;
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context: Record<string, any> = {},
    stackTrace?: string
  ) {
    // Check if we should log this level
    if (level < this.config.minLevel) {
      return;
    }

    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      context: {
        ...context,
        environment: __DEV__ ? 'development' : 'production'
      },
      userId: this.userId,
      sessionId: this.sessionId,
      deviceInfo: this.getDeviceInfo(),
      stackTrace
    };

    // Console output in development
    if (this.config.enableConsole) {
      this.consoleLog(entry);
    }

    // Add to buffer
    this.logBuffer.push(entry);

    // Trim buffer if too large
    if (this.logBuffer.length > this.config.maxLocalLogs) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxLocalLogs);
    }

    // Store locally
    this.storeLogsLocally();

    // Flush if batch size reached
    if (this.logBuffer.length >= this.config.batchSize && this.isOnline) {
      this.flushLogs();
    }
  }

  private consoleLog(entry: LogEntry) {
    const prefix = `[${LogLevel[entry.level]}] ${new Date(entry.timestamp).toISOString()}`;
    const message = `${prefix} - ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.log(message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.context);
        if (entry.stackTrace) {
          console.error(entry.stackTrace);
        }
        break;
    }
  }

  private async storeLogsLocally() {
    try {
      await AsyncStorage.setItem('log_buffer', JSON.stringify(this.logBuffer));
    } catch (error) {
      console.error('Failed to store logs locally', error);
    }
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0 || !this.isOnline) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId,
          'X-User-Id': this.userId || 'anonymous'
        },
        body: JSON.stringify({
          logs: logsToSend,
          deviceInfo: this.getDeviceInfo(),
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        // Put logs back in buffer if send failed
        this.logBuffer = [...logsToSend, ...this.logBuffer];
        console.error('Failed to send logs', response.status);
      } else {
        // Clear stored logs on successful send
        await AsyncStorage.removeItem('log_buffer');
      }
    } catch (error) {
      // Put logs back in buffer if send failed
      this.logBuffer = [...logsToSend, ...this.logBuffer];
      console.error('Failed to send logs', error);
    }
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: DeviceInfo.getModel(),
      appVersion: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber()
    };
  }

  /**
   * Query local logs for debugging
   */
  async queryLogs(
    filter?: {
      level?: LogLevel;
      startTime?: number;
      endTime?: number;
      search?: string;
    }
  ): Promise<LogEntry[]> {
    let logs = [...this.logBuffer];

    if (filter) {
      if (filter.level !== undefined) {
        logs = logs.filter(log => log.level >= filter.level!);
      }
      if (filter.startTime) {
        logs = logs.filter(log => log.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        logs = logs.filter(log => log.timestamp <= filter.endTime!);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        logs = logs.filter(log => 
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.context).toLowerCase().includes(searchLower)
        );
      }
    }

    return logs;
  }

  /**
   * Export logs for debugging
   */
  async exportLogs(): Promise<string> {
    const logs = await this.queryLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear all local logs
   */
  async clearLogs() {
    this.logBuffer = [];
    await AsyncStorage.removeItem('log_buffer');
    this.info('Logs cleared');
  }
}

// Export singleton instance
export const logger = ProductionLogger.getInstance();

// Export convenience methods
export const { debug, info, warn, error, critical, trackAction, trackScreen, trackApiCall } = logger;