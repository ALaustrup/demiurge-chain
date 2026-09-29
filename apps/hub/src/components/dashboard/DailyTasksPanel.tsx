'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

interface DailyTask {
  id: string;
  title: string;
  description: string;
  reward: number; // Sparks
  completed: boolean;
  progress?: number;
  maxProgress?: number;
  link?: string;
}

interface DailyTasksPanelProps {
  onTasksUpdate?: (completedCount: number, totalSparks: number) => void;
}

export function DailyTasksPanel({ onTasksUpdate }: DailyTasksPanelProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch real daily tasks from API
  useEffect(() => {
    if (user) {
      loadDailyTasks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDailyTasks = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch user's daily task progress from RPC
      const userActivity = await demiurgeRpc.getUserActivity(user.id, 50);
      const userStats = await demiurgeRpc.getUserStats(user.id);
      
      // Check today's activity to determine task completion
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();
      
      const todayActivity = userActivity.filter(a => a.timestamp >= todayTimestamp);
      
      // Build real tasks based on today's activity
      const realTasks: DailyTask[] = [
        {
          id: 'daily-login',
          title: 'Daily Login',
          description: 'Log in to the platform',
          reward: 100,
          completed: true, // They're viewing this, so they logged in
        },
        {
          id: 'create-nft',
          title: 'Create an NFT',
          description: 'Mint a new DRC-369 asset',
          reward: 200,
          completed: todayActivity.some(a => a.type === 'nft'),
          progress: todayActivity.filter(a => a.type === 'nft').length,
          maxProgress: 1,
          link: '/create',
        },
        {
          id: 'social-post',
          title: 'Social Activity',
          description: 'Send a message in VYB Social',
          reward: 50,
          completed: todayActivity.some(a => a.type === 'social' || a.type === 'message'),
          link: '/social',
        },
      ];
      
      setTasks(realTasks);
      
      // Calculate streak from consecutive daily logins
      // This would ideally come from the backend
      const streakFromStats = userStats?.karma ? Math.min(Math.floor(userStats.karma / 100), 30) : 0;
      setStreak(streakFromStats);
      
    } catch (error) {
      console.warn('Could not load daily tasks:', error);
      // Fallback to showing just login completed
      setTasks([
        {
          id: 'daily-login',
          title: 'Daily Login',
          description: 'Log in to the platform',
          reward: 100,
          completed: true,
        },
        {
          id: 'create-nft',
          title: 'Create an NFT',
          description: 'Mint a new DRC-369 asset',
          reward: 200,
          completed: false,
          progress: 0,
          maxProgress: 1,
          link: '/create',
        },
        {
          id: 'social-post',
          title: 'Social Activity',
          description: 'Send a message in VYB Social',
          reward: 50,
          completed: false,
          link: '/social',
        },
      ]);
      setStreak(0);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const completedTasks = tasks.filter(t => t.completed);
  const totalSparks = completedTasks.reduce((sum, t) => sum + t.reward, 0);
  const allCompleted = completedTasks.length === tasks.length;

  // Bonus for completing all tasks
  const allCompletedBonus = 300;
  const streakBonus = streak >= 7 ? 1000 : 0;

  useEffect(() => {
    onTasksUpdate?.(completedTasks.length, totalSparks + (allCompleted ? allCompletedBonus : 0) + streakBonus);
  }, [tasks]);

  // Get time until reset (midnight UTC)
  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="glass-panel rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Daily Tasks</h3>
        <div className="text-xs text-gray-400">
          Resets in {getTimeUntilReset()}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-12 bg-white/5 rounded-lg" />
          <div className="h-16 bg-white/5 rounded-lg" />
          <div className="h-16 bg-white/5 rounded-lg" />
          <div className="h-16 bg-white/5 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Streak Display */}
          <div className="flex items-center gap-2 mb-4 glass-panel p-2 rounded-lg">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-sm font-bold text-orange-400">{streak} Day Streak</div>
              <div className="text-xs text-gray-400">
                {streak >= 7 ? '+1000 Sparks bonus!' : `${7 - streak} more days for bonus`}
              </div>
            </div>
          </div>

          {/* Tasks List */}
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-gray-400">No tasks available</p>
              <p className="text-xs text-gray-500 mt-1">Check back later for daily tasks</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`glass-panel p-3 rounded-lg border ${
                      task.completed 
                        ? 'border-neon-green/50 bg-neon-green/5' 
                        : 'border-dark-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          task.completed 
                            ? 'bg-neon-green text-black' 
                            : 'bg-dark-600 text-gray-500'
                        }`}>
                          {task.completed ? '✓' : '○'}
                        </div>
                        <div>
                          <div className={`font-semibold ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {task.title}
                          </div>
                          <div className="text-xs text-gray-500">{task.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-neon-cyan">+{task.reward}</div>
                        <div className="text-xs text-gray-500">Sparks</div>
                      </div>
                    </div>
                    {task.progress !== undefined && task.maxProgress && !task.completed && (
                      <div className="mt-2">
                        <div className="h-1 bg-dark-700 rounded-full">
                          <div 
                            className="h-full bg-neon-cyan rounded-full"
                            style={{ width: `${(task.progress / task.maxProgress) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {task.link && !task.completed && (
                      <Link 
                        href={task.link}
                        className="mt-2 text-xs text-neon-cyan hover:underline inline-block"
                      >
                        Go complete →
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* All Completed Bonus */}
              <div className={`glass-panel p-3 rounded-lg border ${
                allCompleted 
                  ? 'border-yellow-500/50 bg-yellow-500/10' 
                  : 'border-dark-600 opacity-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{allCompleted ? '🎉' : '🎯'}</span>
                    <div>
                      <div className="font-semibold text-white">All Tasks Complete</div>
                      <div className="text-xs text-gray-400">Complete all daily tasks</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-400">+{allCompletedBonus}</div>
                    <div className="text-xs text-gray-500">Bonus Sparks</div>
                  </div>
                </div>
              </div>

              {/* Total Earned */}
              <div className="mt-4 pt-4 border-t border-dark-600">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Today's Earnings</span>
                  <span className="text-xl font-bold text-neon-cyan">
                    {(totalSparks + (allCompleted ? allCompletedBonus : 0) + streakBonus).toLocaleString()} Sparks
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = {((totalSparks + (allCompleted ? allCompletedBonus : 0) + streakBonus) / 100).toFixed(2)} CGT
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
