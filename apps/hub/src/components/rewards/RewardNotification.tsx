'use client';

import { useState, useEffect } from 'react';

interface RewardNotificationProps {
  // Component listens to global events by default
}

interface RewardEvent {
  amount: number;
  type: string;
  description: string;
}

export function RewardNotification({}: RewardNotificationProps) {
  const [notifications, setNotifications] = useState<(RewardEvent & { id: number })[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const handleReward = (event: CustomEvent<RewardEvent>) => {
      const newNotification = {
        ...event.detail,
        id: nextId,
      };
      
      setNotifications(prev => [...prev, newNotification]);
      setNextId(prev => prev + 1);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    };

    window.addEventListener('cgt-reward', handleReward as EventListener);
    return () => window.removeEventListener('cgt-reward', handleReward as EventListener);
  }, [nextId]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="glass-panel liquid-border p-4 rounded-xl w-80 animate-slide-in-right"
          style={{
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-neon-cyan flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💰</span>
            </div>
            <div className="flex-1">
              <p className="text-green-400 font-grunge text-xl">
                +{notification.amount} CGT
              </p>
              <p className="text-gray-400 text-sm font-body">
                {notification.description}
              </p>
            </div>
          </div>
          
          {/* Progress bar for auto-dismiss */}
          <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-neon-cyan"
              style={{
                animation: 'shrinkWidth 5s linear forwards',
              }}
            />
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
