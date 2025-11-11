/**
 * Production Error Handler for Mobile App
 * NO FALLBACKS - Proper error handling with logging and user feedback
 */

import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface ErrorContext {
  userId?: string;
  action: string;
  component?: string;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  id: string;
  timestamp: number;
  error: Error;
  context: ErrorContext;
  deviceInfo: DeviceInfo;
  networkStatus: boolean;
}

interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  memory: number;
}

export class ProductionErrorHandler {
  private static instance: ProductionErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = true;

  private constructor() {
    this.initializeNetworkListener();
    this.initializeSentry();
  }

  static getInstance(): ProductionErrorHandler {
    if (!ProductionErrorHandler.instance) {
      ProductionErrorHandler.instance = new ProductionErrorHandler();
    }
    return ProductionErrorHandler.instance;
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.flushErrorQueue();
      }
    });
  }

  private initializeSentry() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.2,
      beforeSend: (event, hint) => {
        // Add custom context
        event.contexts = {
          ...event.contexts,
          custom: {
            errorQueue: this.errorQueue.length,
            isOnline: this.isOnline,
          }
        };
        return event;
      }
    });
  }

  /**
   * Main error handling method - NO FALLBACKS
   */
  async handleError(
    error: Error,
    context: ErrorContext,
    userMessage?: string
  ): Promise<void> {
    // 1. Log error with full context
    const errorReport = this.createErrorReport(error, context);
    console.error('[ProductionError]', {
      id: errorReport.id,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    // 2. Send to crash reporting
    if (this.isOnline) {
      this.sendToSentry(errorReport);
    } else {
      this.queueError(errorReport);
    }

    // 3. Store error locally for debugging
    await this.storeErrorLocally(errorReport);

    // 4. Track error metrics
    this.trackErrorMetrics(errorReport);

    // 5. Provide user feedback
    this.showUserError(userMessage || this.getUserMessage(error));

    // 6. Notify monitoring service
    await this.notifyMonitoring(errorReport);
  }

  private createErrorReport(
    error: Error,
    context: ErrorContext
  ): ErrorReport {
    return {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      error,
      context,
      deviceInfo: this.getDeviceInfo(),
      networkStatus: this.isOnline
    };
  }

  private sendToSentry(report: ErrorReport) {
    Sentry.captureException(report.error, {
      contexts: {
        error_context: report.context,
        device: report.deviceInfo,
        network: { online: report.networkStatus }
      },
      tags: {
        action: report.context.action,
        component: report.context.component || 'unknown'
      },
      extra: report.context.metadata
    });
  }

  private async queueError(report: ErrorReport) {
    this.errorQueue.push(report);
    // Store queue in AsyncStorage for persistence
    await AsyncStorage.setItem(
      'error_queue',
      JSON.stringify(this.errorQueue)
    );
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    for (const report of errors) {
      this.sendToSentry(report);
    }

    await AsyncStorage.removeItem('error_queue');
  }

  private async storeErrorLocally(report: ErrorReport) {
    try {
      const errorLog = await AsyncStorage.getItem('error_log');
      const errors = errorLog ? JSON.parse(errorLog) : [];
      
      // Keep only last 50 errors
      errors.push(report);
      if (errors.length > 50) {
        errors.shift();
      }

      await AsyncStorage.setItem('error_log', JSON.stringify(errors));
    } catch (e) {
      // If we can't store locally, at least log it
      console.error('Failed to store error locally', e);
    }
  }

  private trackErrorMetrics(report: ErrorReport) {
    // Track error metrics for monitoring
    const metrics = {
      error_type: report.error.name,
      error_action: report.context.action,
      error_component: report.context.component,
      timestamp: report.timestamp,
      online: report.networkStatus
    };

    // Send to analytics service
    if (global.analytics) {
      global.analytics.track('error_occurred', metrics);
    }
  }

  private showUserError(message: string) {
    // Show user-friendly error message
    if (global.toast) {
      global.toast.error(message, {
        duration: 5000,
        action: {
          label: 'Report',
          onClick: () => this.openErrorReport()
        }
      });
    }
  }

  private getUserMessage(error: Error): string {
    // Map technical errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      'NetworkError': 'Connection issue. Please check your internet.',
      'TimeoutError': 'Request timed out. Please try again.',
      'ValidationError': 'Invalid input. Please check your data.',
      'AuthenticationError': 'Authentication failed. Please sign in again.',
      'PermissionError': 'You don\'t have permission for this action.',
      'NotFoundError': 'The requested item was not found.',
      'RateLimitError': 'Too many requests. Please wait a moment.',
      'ServerError': 'Server error. Our team has been notified.'
    };

    return errorMessages[error.name] || 
           'Something went wrong. Please try again.';
  }

  private async notifyMonitoring(report: ErrorReport) {
    // Send critical errors to monitoring service
    if (this.isCriticalError(report.error)) {
      try {
        await fetch('https://monitoring.strength.design/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: report.id,
            error: report.error.message,
            context: report.context,
            severity: 'critical',
            timestamp: report.timestamp
          })
        });
      } catch (e) {
        console.error('Failed to notify monitoring', e);
      }
    }
  }

  private isCriticalError(error: Error): boolean {
    const criticalErrors = [
      'AuthenticationError',
      'DataLossError',
      'SecurityError',
      'PaymentError'
    ];
    return criticalErrors.includes(error.name);
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: DeviceInfo.getModel(),
      memory: DeviceInfo.getTotalMemory()
    };
  }

  private openErrorReport() {
    // Open error report modal or navigate to error report screen
    if (global.navigation) {
      global.navigation.navigate('ErrorReport');
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context: ErrorContext
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Log retry attempt
        if (attempt > 0) {
          console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries}`, context);
        }
        
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry certain errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }
        
        // Calculate backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All retries failed
    await this.handleError(
      lastError!,
      { ...context, retries: maxRetries },
      'Operation failed after multiple attempts'
    );
    
    throw lastError!;
  }

  private isNonRetryableError(error: Error): boolean {
    const nonRetryableErrors = [
      'ValidationError',
      'AuthenticationError',
      'PermissionError',
      'NotFoundError'
    ];
    return nonRetryableErrors.includes(error.name);
  }
}

// Export singleton instance
export const errorHandler = ProductionErrorHandler.getInstance();