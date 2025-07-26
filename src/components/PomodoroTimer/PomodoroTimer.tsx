import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { pomodoroAPI } from '../services/api';

interface PomodoroSession {
  id: string;
  date: string;
  focusTime: number;
  completed: boolean;
  startTime: string;
  endTime?: string;
  notes?: string;
}

interface PomodoroStats {
  userId: string;
  date: string;
  completedSessions: number;
  totalFocusTime: number;
}

const PomodoroTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<'focus' | 'break'>('focus');
  const [sessionCount, setSessionCount] = useState(0);
  const [settings, setSettings] = useState({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [notes, setNotes] = useState('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadTodayStats();
    loadRecentSessions();
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            handleSessionComplete();
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
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const response = await pomodoroAPI.getSessions({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleSessionComplete = async () => {
    setIsActive(false);
    setIsPaused(false);
    
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    if (currentSession === 'focus') {
      // Save completed focus session
      try {
        await pomodoroAPI.createSession({
          date: new Date().toISOString(),
          focusTime: settings.focusTime,
          notes: notes.trim() || undefined
        });
        
        setSessionCount(prev => prev + 1);
        loadTodayStats();
        loadRecentSessions();
        setNotes('');
      } catch (error) {
        console.error('Error saving session:', error);
      }

      // Switch to break
      const isLongBreak = (sessionCount + 1) % settings.sessionsUntilLongBreak === 0;
      const breakTime = isLongBreak ? settings.longBreak : settings.shortBreak;
      
      setCurrentSession('break');
      setTimeLeft(breakTime * 60);
      
      if (settings.autoStartBreaks) {
        setIsActive(true);
      }
    } else {
      // Break completed, switch back to focus
      setCurrentSession('focus');
      setTimeLeft(settings.focusTime * 60);
      
      if (settings.autoStartPomodoros) {
        setIsActive(true);
      }
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    if (currentSession === 'focus') {
      setTimeLeft(settings.focusTime * 60);
    } else {
      const isLongBreak = sessionCount % settings.sessionsUntilLongBreak === 0;
      const breakTime = isLongBreak ? settings.longBreak : settings.shortBreak;
      setTimeLeft(breakTime * 60);
    }
  };

  const handleSettingsUpdate = (newSettings: typeof settings) => {
    setSettings(newSettings);
    if (!isActive) {
      setTimeLeft(newSettings.focusTime * 60);
    }
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = currentSession === 'focus' 
      ? settings.focusTime * 60 
      : (sessionCount % settings.sessionsUntilLongBreak === 0 ? settings.longBreak : settings.shortBreak) * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav" />
      </audio>

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
        {/* Timer */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {currentSession === 'focus' ? 'Focus Time' : 'Break Time'}
                </h3>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  currentSession === 'focus' 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                }`}>
                  Session {sessionCount + 1}
                </div>
              </div>

              {/* Circular Progress */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
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
                    className={currentSession === 'focus' ? 'text-red-500' : 'text-green-500'}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {Math.round(getProgress())}% complete
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4">
                {!isActive ? (
                  <button
                    onClick={handleStart}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                  >
                    <Pause className="w-5 h-5" />
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                )}
                
                <button
                  onClick={handleReset}
                  className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Notes */}
              {currentSession === 'focus' && (
                <div className="mt-6">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What are you working on? (optional)"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Sessions */}
        <div className="space-y-6">
          {/* Today's Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Today's Progress
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Sessions:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats?.completedSessions || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Focus Time:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round((stats?.totalFocusTime || 0) / 60)} min
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current Streak:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {sessionCount}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Recent Sessions
            </h3>
            
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.focusTime} min session
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(session.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      session.completed ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                  {session.notes && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {session.notes}
                    </div>
                  )}
                </div>
              ))}
              
              {sessions.length === 0 && (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
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
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSettingsUpdate({
                  focusTime: parseInt(formData.get('focusTime') as string),
                  shortBreak: parseInt(formData.get('shortBreak') as string),
                  longBreak: parseInt(formData.get('longBreak') as string),
                  sessionsUntilLongBreak: parseInt(formData.get('sessionsUntilLongBreak') as string),
                  autoStartBreaks: formData.get('autoStartBreaks') === 'true',
                  autoStartPomodoros: formData.get('autoStartPomodoros') === 'true'
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Focus Time (minutes)
                </label>
                <input
                  type="number"
                  name="focusTime"
                  defaultValue={settings.focusTime}
                  min="1"
                  max="60"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short Break (minutes)
                </label>
                <input
                  type="number"
                  name="shortBreak"
                  defaultValue={settings.shortBreak}
                  min="1"
                  max="30"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Long Break (minutes)
                </label>
                <input
                  type="number"
                  name="longBreak"
                  defaultValue={settings.longBreak}
                  min="1"
                  max="60"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sessions until long break
                </label>
                <input
                  type="number"
                  name="sessionsUntilLongBreak"
                  defaultValue={settings.sessionsUntilLongBreak}
                  min="2"
                  max="10"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="autoStartBreaks"
                    value="true"
                    defaultChecked={settings.autoStartBreaks}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-start breaks</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="autoStartPomodoros"
                    value="true"
                    defaultChecked={settings.autoStartPomodoros}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-start pomodoros</span>
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;