'use client';

import { useVYB } from '@/contexts/VYBContext';
import Link from 'next/link';

export function NotificationsPanel() {
  const { 
    notifications, 
    unreadNotificationCount, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useVYB();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return '💬';
      case 'follow': return '👤';
      case 'like': return '❤️';
      case 'comment': return '💭';
      case 'tip': return '💰';
      case 'mention': return '@';
      case 'achievement': return '🏆';
      case 'reward': return '🎁';
      case 'nft_sold': return '🖼️';
      case 'order_update': return '📦';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'tip': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'achievement': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'like': return 'from-pink-500/20 to-red-500/20 border-pink-500/30';
      case 'follow': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-grunge-alt text-xl text-neon-cyan flex items-center gap-2">
          🔔 Notifications
          {unreadNotificationCount > 0 && (
            <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadNotificationCount}
            </span>
          )}
        </h2>
        {unreadNotificationCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-sm text-gray-500 hover:text-neon-cyan transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">🔔</p>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-4 border-b border-gray-800/50 cursor-pointer transition-colors ${
                notif.isRead ? 'bg-transparent' : 'bg-blockchain-light/30'
              } hover:bg-blockchain-light/50`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getNotificationColor(notif.type)} border flex items-center justify-center text-lg flex-shrink-0`}>
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-body ${notif.isRead ? 'text-gray-400' : 'text-white'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(notif.createdAt)}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-2" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 text-center">
        <Link 
          href="/social/notifications"
          className="text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors"
        >
          View all notifications →
        </Link>
      </div>
    </div>
  );
}
