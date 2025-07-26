import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { pomodoroAPI } from '../../services/api';

interface PomodoroStats {
  userId: string;
  date: string;
  completedSessions: number;
  totalFocusTime: number;
}

interface PomodoroSession {
  _id: string;
  userId: string;
  date: Date;
  focusTime: number;
  completed: boolean;
  startTime: Date;
  endTime?: Date;
  notes?: string;
}

interface PomodoroAnalytics {
  totalSessions: number;
  totalFocusTime: number;
  dailyAverage: number;
  dailyData: Array<{
    date: string;
    count: number;
    totalFocusTime: number;
  }>;
}

const PomodoroTimer: React.FC = () => {
  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  
  // Settings state
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  
  // Data state
  const [todayStats, setTodayStats] = useState<PomodoroStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<PomodoroSession[]>([]);
  const [analytics, setAnalytics] = useState<PomodoroAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    loadTodayStats();
    loadRecentSessions();
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await pomodoroAPI.getStats(today);
      setTodayStats(response.data);
    } catch (error) {
      console.error('Error loading today stats:', error);
      // Set default stats if API fails
      setTodayStats({
        userId: 'current-user',
        date: new Date().toISOString().split('T')[0],
        completedSessions: 0,
        totalFocusTime: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const response = await pomodoroAPI.getSessions({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      setRecentSessions(response.data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
      setRecentSessions([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await pomodoroAPI.getAnalytics('week');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics({
        totalSessions: 0,
        totalFocusTime: 0,
        dailyAverage: 0,
        dailyData: []
      });
    }
  };

  const saveSession = async (focusTime: number, completed: boolean = true) => {
    try {
      const sessionData = {
        date: new Date().toISOString(),
        focusTime,
        notes: notes.trim() || undefined
      };

      await pomodoroAPI.createSession(sessionData);
      
      // Reload stats and sessions
      await Promise.all([
        loadTodayStats(),
        loadRecentSessions(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleTimerComplete = async () => {
    setIsActive(false);
    setIsPaused(false);
    
    if (sessionType === 'work') {
      const focusTime = workDuration;
      await saveSession(focusTime, true);
      setCompletedSessions(prev => prev + 1);
      
      // Determine next break type
      const nextBreakType = (completedSessions + 1) % sessionsUntilLongBreak === 0 ? 'long' : 'short';
      const breakDuration = nextBreakType === 'long' ? longBreakDuration : shortBreakDuration;
      
      setSessionType('break');
      setTimeLeft(breakDuration * 60);
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Complete!', {
          body: `Great work! Time for a ${nextBreakType} break.`,
          icon: '/favicon.ico'
        });
      }
    } else {
      // Break completed
      setSessionType('work');
      setTimeLeft(workDuration * 60);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Break Over!', {
          body: 'Ready to get back to work?',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const startTimer = () => {
    if (!isActive) {
      startTimeRef.current = new Date();
    }
    setIsActive(true);
    setIsPaused(false);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    const duration = sessionType === 'work' ? workDuration : 
                    (completedSessions % sessionsUntilLongBreak === 0 ? longBreakDuration : shortBreakDuration);
    setTimeLeft(duration * 60);
    startTimeRef.current = null;
  };

  const skipSession = () => {
    if (sessionType === 'work') {
      setSessionType('break');
      const breakDuration = completedSessions % sessionsUntilLongBreak === 0 ? longBreakDuration : shortBreakDuration;
      setTimeLeft(breakDuration * 60);
    } else {
      setSessionType('work');
      setTimeLeft(workDuration * 60);
    }
    setIsActive(false);
    setIsPaused(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgress = () => {
    const totalDuration = sessionType === 'work' ? workDuration * 60 : 
                         (completedSessions % sessionsUntilLongBreak === 0 ? longBreakDuration * 60 : shortBreakDuration * 60);
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Pomodoro Timer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Clock className="w-6 h-6 mr-2 text-red-600" />
            Pomodoro Timer
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Stay focused with the Pomodoro Technique</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              {/* Session Type Indicator */}
              <div className="mb-6">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  sessionType === 'work' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {sessionType === 'work' ? 'Focus Time' : 'Break Time'}
                </span>
              </div>

              {/* Timer Display */}
              <div className="relative mb-8">
                <div className="w-64 h-64 mx-auto relative">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                      className={sessionType === 'work' ? 'text-red-600' : 'text-green-600'}
                      style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {formatTime(timeLeft)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Session {completedSessions + 1}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <button
                  onClick={resetTimer}
                  className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
                
                <button
                  onClick={isActive && !isPaused ? pauseTimer : startTimer}
                  className={`p-4 rounded-full text-white transition-colors ${
                    sessionType === 'work' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isActive && !isPaused ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </button>
                
                <button
                  onClick={skipSession}
                  className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <Target className="w-6 h-6" />
                </button>
              </div>

              {/* Notes */}
              <div className="max-w-md mx-auto">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this session..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="space-y-6">
          {/* Today's Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Today's Progress
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Sessions</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {todayStats?.completedSessions || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Focus Time</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatDuration(todayStats?.totalFocusTime || 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Next: {completedSessions % sessionsUntilLongBreak === 0 ? 'Long' : 'Short'} Break
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedSessions % sessionsUntilLongBreak) / sessionsUntilLongBreak * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Analytics */}
          {analytics && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                This Week
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Sessions</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analytics.totalSessions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Focus</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDuration(analytics.totalFocusTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Daily Average</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analytics.dailyAverage.toFixed(1)} sessions
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sessions</h3>
            <div className="space-y-3">
              {recentSessions.slice(0, 5).map((session) => (
                <div key={session._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDuration(session.focusTime)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(session.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    session.completed ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
              ))}
              {recentSessions.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No sessions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Pomodoro Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Work Duration (minutes)
                </label>
                <input
                  type="number"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(parseInt(e.target.value) || 25)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="1"
                  max="60"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short Break (minutes)
                </label>
                <input
                  type="number"
                  value={shortBreakDuration}
                  onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 5)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="1"
                  max="30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Long Break (minutes)
                </label>
                <input
                  type="number"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 15)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="1"
                  max="60"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sessions until Long Break
                </label>
                <input
                  type="number"
                  value={sessionsUntilLongBreak}
                  onChange={(e) => setSessionsUntilLongBreak(parseInt(e.target.value) || 4)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="2"
                  max="10"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Apply settings and reset timer
                  resetTimer();
                  setShowSettings(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;