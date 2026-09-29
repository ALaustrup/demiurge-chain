/**
 * Services Index
 * Central export point for all Phase 3 services
 */

export { blockchainService } from './blockchain';
export type {
  ValidatorStats,
  AccountBalance,
  Transaction,
  NFTMetadata,
  GameState,
  StakingReward,
  NetworkMetrics,
} from './blockchain';

export { wsService, useWebSocketSubscription } from './websocket';
export type { SubscriptionChannel, SubscriptionOptions } from './websocket';

export { analyticsService } from './analytics';
export type {
  PortfolioMetrics,
  AssetAllocation,
  PerformanceMetrics,
  StakingMetrics,
  NFTMetrics,
  ChartDataPoint,
} from './analytics';

export { notificationService, useNotifications } from './notifications';
export type { Notification, NotificationPreferences, NotificationType } from './notifications';
