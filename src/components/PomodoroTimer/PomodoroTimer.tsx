import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings, Check, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';
import api from '../../services/api';
// Define types
interface PomodoroSettings {
  focusTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  sessionsGoal: number;
  soundEnabled: boolean;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface PomodoroSession {
  userId: string;
  date: string;
  completedSessions: number;
  totalFocusTime: number;
}

const PomodoroTimer: React.FC = () => {
  // Default settings
  const defaultSettings: PomodoroSettings = {
    focusTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    sessionsGoal: 8,
    soundEnabled: true
  };

  // Load settings from localStorage or use defaults
  const loadSettings = (): PomodoroSettings => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  };

  // State variables
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [todayStats, setTodayStats] = useState<PomodoroSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs
  const timerRef = useRef<number | null>(null);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Load today's stats on component mount
  useEffect(() => {
    loadTodayStats();
  }, []);

  // Handle timer logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  // Reset timer when mode changes
  useEffect(() => {
    let newTime = 0;
    switch (mode) {
      case 'focus':
        newTime = settings.focusTime * 60;
        break;
      case 'shortBreak':
        newTime = settings.shortBreakTime * 60;
        break;
      case 'longBreak':
        newTime = settings.longBreakTime * 60;
        break;
    }
    setTimeLeft(newTime);
    setIsActive(false);
  }, [mode, settings]);

  // Load today's stats
  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/pomodoro/stats', { params: { date: today } });
      if (response.data) {
        setTodayStats(response.data);
        setSessionsCompleted(response.data.completedSessions || 0);
      }
    } catch (error) {
      console.error('Error loading pomodoro stats:', error);
      // If API fails, use local storage as fallback
      const localSessions = localStorage.getItem('pomodoroSessions');
      if (localSessions) {
        setSessionsCompleted(parseInt(localSessions));
      }
    }
  };

  // Save session to backend
  const saveSession = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.post('/pomodoro/sessions', {
        date: today,
        focusTime: settings.focusTime
      });
      await loadTodayStats(); // Reload stats after saving
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
      // If API fails, use local storage as fallback
      localStorage.setItem('pomodoroSessions', String(sessionsCompleted));
    }
  };

  // Handle timer completion
  const handleTimerComplete = () => {
    if (settings.soundEnabled) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Error playing sound:", e));
      }
    }

    if (mode === 'focus') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      // Save completed session to backend
      saveSession();
      
      // After every 4 focus sessions, take a long break
      if (newSessionsCompleted % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      // After a break, go back to focus mode
      setMode('focus');
    }
  };

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer controls
  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    switch (mode) {
      case 'focus':
        setTimeLeft(settings.focusTime * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakTime * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakTime * 60);
        break;
    }
  };

  const skipToNext = () => {
    setIsActive(false);
    if (mode === 'focus') {
      // If in focus mode, skip to break without counting it as completed
      if ((sessionsCompleted + 1) % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      // If in break mode, skip to focus
      setMode('focus');
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Toggle sound
  const toggleSound = () => {
    setSettings({
      ...settings,
      soundEnabled: !settings.soundEnabled
    });
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    let totalTime = 0;
    switch (mode) {
      case 'focus':
        totalTime = settings.focusTime * 60;
        break;
      case 'shortBreak':
        totalTime = settings.shortBreakTime * 60;
        break;
      case 'longBreak':
        totalTime = settings.longBreakTime * 60;
        break;
    }
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Save settings
  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newSettings: PomodoroSettings = {
      focusTime: parseInt(form.focusTime.value),
      shortBreakTime: parseInt(form.shortBreakTime.value),
      longBreakTime: parseInt(form.longBreakTime.value),
      sessionsGoal: parseInt(form.sessionsGoal.value),
      soundEnabled: settings.soundEnabled
    };
    setSettings(newSettings);
    setShowSettings(false);
    resetTimer();
  };

  // Get mode label
  const getModeLabel = (): string => {
    switch (mode) {
      case 'focus':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  // Get mode color
  const getModeColor = (): string => {
    switch (mode) {
      case 'focus':
        return darkMode ? 'bg-blue-700' : 'bg-blue-600';
      case 'shortBreak':
        return darkMode ? 'bg-green-700' : 'bg-green-600';
      case 'longBreak':
        return darkMode ? 'bg-purple-700' : 'bg-purple-600';
    }
  };

  // Main container classes based on dark mode
  const containerClasses = darkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-white text-gray-900';

  return (
    <div className="p-6 flex items-center justify-center">
      <div className={`w-full max-w-md rounded-xl shadow-lg p-6 ${containerClasses} transition-colors duration-300`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
          <div className="flex space-x-2">
            <button 
              onClick={toggleSound} 
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label={settings.soundEnabled ? "Mute sound" : "Enable sound"}
            >
              {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => setShowSettings(true)} 
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex mb-6 rounded-lg overflow-hidden">
          <button 
            onClick={() => { setMode('focus'); resetTimer(); }}
            className={`flex-1 py-2 text-center font-medium ${mode === 'focus' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
          >
            Focus
          </button>
          <button 
            onClick={() => { setMode('shortBreak'); resetTimer(); }}
            className={`flex-1 py-2 text-center font-medium ${mode === 'shortBreak' ? 'bg-green-600 text-white' : darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
          >
            Short Break
          </button>
          <button 
            onClick={() => { setMode('longBreak'); resetTimer(); }}
            className={`flex-1 py-2 text-center font-medium ${mode === 'longBreak' ? 'bg-purple-600 text-white' : darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
          >
            Long Break
          </button>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold mb-2">{formatTime(timeLeft)}</div>
          <div className="text-lg font-medium">{getModeLabel()}</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full mb-6 overflow-hidden">
          <div 
            className={`h-full ${getModeColor()} transition-all duration-300`} 
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4 mb-6">
          <button 
            onClick={toggleTimer} 
            className={`p-4 rounded-full ${getModeColor()} text-white hover:opacity-90 transition-opacity`}
            aria-label={isActive ? "Pause" : "Start"}
          >
            {isActive ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button 
            onClick={resetTimer} 
            className={`p-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} hover:opacity-90 transition-opacity`}
            aria-label="Reset"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={skipToNext} 
            className={`p-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} hover:opacity-90 transition-opacity`}
            aria-label="Skip"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Session Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Sessions</span>
            <span>{sessionsCompleted} / {settings.sessionsGoal}</span>
          </div>
          <div className="flex space-x-1">
            {Array.from({ length: settings.sessionsGoal }).map((_, index) => (
              <div 
                key={index} 
                className={`flex-1 h-2 rounded-full ${
                  index < sessionsCompleted 
                    ? getModeColor() 
                    : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Session Checkmarks */}
        <div className="flex flex-wrap gap-2 justify-center">
          {Array.from({ length: settings.sessionsGoal }).map((_, index) => (
            <div 
              key={index} 
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                index < sessionsCompleted 
                  ? getModeColor() 
                  : darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
              }`}
            >
              {index < sessionsCompleted && <Check size={16} className="text-white" />}
            </div>
          ))}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-md rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-xl font-bold mb-4">Timer Settings</h2>
              <form onSubmit={saveSettings}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Focus Time (minutes)</label>
                    <input 
                      type="number" 
                      name="focusTime" 
                      defaultValue={settings.focusTime}
                      min="1" 
                      max="60" 
                      className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Short Break (minutes)</label>
                    <input 
                      type="number" 
                      name="shortBreakTime" 
                      defaultValue={settings.shortBreakTime}
                      min="1" 
                      max="60" 
                      className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Long Break (minutes)</label>
                    <input 
                      type="number" 
                      name="longBreakTime" 
                      defaultValue={settings.longBreakTime}
                      min="1" 
                      max="60" 
                      className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Daily Sessions Goal</label>
                    <input 
                      type="number" 
                      name="sessionsGoal" 
                      defaultValue={settings.sessionsGoal}
                      min="1" 
                      max="16" 
                      className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowSettings(false)}
                    className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;