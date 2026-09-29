/**
 * VYB Event Bus - In-memory pub/sub for real-time events
 * For multi-instance deployments, replace with Redis pub/sub.
 */

type EventHandler = (event: SSEvent) => void;

export interface SSEvent {
  type: string;
  data: any;
  roomId?: string;
  targetQorId?: string;
}

class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  subscribe(qorId: string, handler: EventHandler): () => void {
    if (!this.listeners.has(qorId)) {
      this.listeners.set(qorId, new Set());
    }
    this.listeners.get(qorId)!.add(handler);

    return () => {
      this.listeners.get(qorId)?.delete(handler);
      if (this.listeners.get(qorId)?.size === 0) {
        this.listeners.delete(qorId);
      }
    };
  }

  publish(event: SSEvent): void {
    // Send to specific user
    if (event.targetQorId) {
      this.listeners.get(event.targetQorId)?.forEach(h => h(event));
      return;
    }

    // Broadcast to all connected users
    this.listeners.forEach((handlers) => {
      handlers.forEach(h => h(event));
    });
  }

  getOnlineUsers(): string[] {
    return Array.from(this.listeners.keys());
  }

  isOnline(qorId: string): boolean {
    return this.listeners.has(qorId);
  }
}

// Global singleton
export const eventBus = new EventBus();

// Helper to publish from any module
export function publishEvent(event: SSEvent): void {
  eventBus.publish(event);
}
