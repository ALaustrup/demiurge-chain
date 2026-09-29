'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVYB } from '@/contexts/VYBContext';

interface NotificationItem {
  id: string;
  type: 'message' | 'tip' | 'follow' | 'like' | 'achievement';
  from: string;
  preview?: string;
  timestamp: Date;
  read: boolean;
}

export function VYBNotificationWidget() {
  const { notifications, unreadNotificationCount } = useVYB();
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Convert VYB notifications to widget format
    if (notifications) {
      const items: NotificationItem[] = notifications.slice(0, 5).map(n => ({
        id: n.id,
        type: n.type as any,
        from: n.title || 'System',
        preview: n.message,
        timestamp: n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt),
        read: n.isRead,
      }));
      setRecentNotifications(items);
    }
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return '💬';
      case 'tip': return '💰';
      case 'follow': return '👥';
      case 'like': return '❤️';
      case 'achievement': return '🏆';
      default: return '🔔';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="glass-panel rounded-xl p-6 border border-neon-magenta/20 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-magenta/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-grunge text-neon-magenta">🔔 VYB Social</h3>
          {unreadNotificationCount > 0 && (
            <span className="bg-neon-magenta text-black text-xs font-bold px-2 py-1 rounded-full">
              {unreadNotificationCount} new
            </span>
          )}
        </div>

        {recentNotifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-400 text-sm">No notifications yet</p>
            <Link 
              href="/social" 
              className="text-neon-magenta text-sm hover:underline mt-2 inline-block"
            >
              Explore VYB →
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {recentNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.type === 'message' ? '/social?tab=messages' : '/social?tab=notifications'}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-white/5 ${
                    !notification.read ? 'bg-neon-magenta/5 border-l-2 border-neon-magenta' : ''
                  }`}
                >
                  <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                        {notification.from}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    {notification.preview && (
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {notification.preview}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/social?tab=notifications"
              className="block text-center text-sm text-neon-magenta hover:underline"
            >
              View all notifications →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
