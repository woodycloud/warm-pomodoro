import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Flame, Timer, Sparkles, Award, Coffee, RefreshCcw, BellRing } from 'lucide-react';
import { FocusSession, TimerMode, TimerState, Settings, Task } from './types';
import TimerRing from './components/TimerRing';
import TaskSelector from './components/TaskSelector';
import StatsDashboard from './components/StatsDashboard';
import SettingsModal from './components/SettingsModal';
import { playChime, playFocusStartChime, playClickSound } from './lib/audio';

// Default parameters
const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  soundVolume: 0.5,
};

export default function App() {
  // --- Persistent States from LocalStorage ---
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem('pomodoro_settings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem('pomodoro_tasks');
    return stored ? JSON.parse(stored) : [
      { id: 't1', title: '完成第一个专注周期 🌟', completed: false, estimatedPomodoros: 1, completedPomodoros: 0, createdAt: new Date().toISOString() },
      { id: 't2', title: '阅读并整理读书笔记 📚', completed: false, estimatedPomodoros: 2, completedPomodoros: 0, createdAt: new Date().toISOString() }
    ];
  });

  const [sessions, setSessions] = useState<FocusSession[]>(() => {
    const stored = localStorage.getItem('pomodoro_sessions');
    return stored ? JSON.parse(stored) : [];
  });

  // --- UI/Runtime States ---
  const [mode, setMode] = useState<TimerMode>('work');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    const stored = localStorage.getItem('pomodoro_active_task_id');
    return stored;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Time remaining in seconds
  const [timeLeft, setTimeLeft] = useState(() => settings.workDuration * 60);
  const [totalDuration, setTotalDuration] = useState(() => settings.workDuration * 60);

  // Interval reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Track work duration in current session to log precisely
  const sessionStartTimeRef = useRef<string | null>(null);

  // --- LocalStorage Syncing Effects ---
  useEffect(() => {
    localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('pomodoro_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem('pomodoro_active_task_id', activeTaskId);
    } else {
      localStorage.removeItem('pomodoro_active_task_id');
    }
  }, [activeTaskId]);

  // --- Dynamic Mode/Settings Duration Adjustment ---
  useEffect(() => {
    if (timerState === 'idle') {
      const durationMins = getDurationForMode(mode);
      setTimeLeft(durationMins * 60);
      setTotalDuration(durationMins * 60);
    }
  }, [mode, settings, timerState]);

  // --- Dynamic Title Update ---
  useEffect(() => {
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (timerState === 'running') {
      const phaseIcon = mode === 'work' ? '🍅' : '☕';
      const modeLabel = mode === 'work' ? '专注中' : '休息中';
      document.title = `${formatTime(timeLeft)} | ${phaseIcon} ${modeLabel}`;
    } else if (timerState === 'paused') {
      document.title = `暂停中 - ${formatTime(timeLeft)} | 🍅番茄钟`;
    } else {
      document.title = '极简番茄工作法 | 温暖番茄钟';
    }
  }, [timeLeft, timerState, mode]);

  // --- Helper to get duration based on mode ---
  const getDurationForMode = (tMode: TimerMode): number => {
    switch (tMode) {
      case 'work':
        return settings.workDuration;
      case 'break':
        return settings.breakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
      default:
        return 25;
    }
  };

  // --- Core Timer Engine ---
  useEffect(() => {
    if (timerState === 'running') {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date().toISOString();
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerExpiration();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState, mode]);

  // --- Handle Countdown Expiration ---
  const handleTimerExpiration = () => {
    const finishedMode = mode;
    const sessionDurationMins = getDurationForMode(finishedMode);
    const activeTask = tasks.find(t => t.id === activeTaskId);

    // Stop current timer cycle
    setTimerState('idle');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 1. Log Focus/Break Session in History
    const newSession: FocusSession = {
      id: Math.random().toString(36).substring(2, 9),
      startTime: sessionStartTimeRef.current || new Date().toISOString(),
      duration: sessionDurationMins,
      mode: finishedMode,
      taskName: finishedMode === 'work' ? (activeTask ? activeTask.title : '自主专注') : '放松休息',
      completed: true,
    };
    setSessions(prev => [...prev, newSession]);
    sessionStartTimeRef.current = null;

    // 2. Sound alerts
    if (settings.soundEnabled) {
      playChime(settings.soundVolume);
    }

    // 3. Update Tasks if Work mode completed
    if (finishedMode === 'work' && activeTaskId) {
      setTasks(prev => prev.map(task => {
        if (task.id === activeTaskId) {
          const updatedCompleted = task.completedPomodoros + 1;
          // Auto complete if target reached (optional) or just increment
          return {
            ...task,
            completedPomodoros: updatedCompleted,
          };
        }
        return task;
      }));
    }

    // 4. Mode Auto Progression Toggles
    if (finishedMode === 'work') {
      // Determine if next break should be a long break (e.g. after every 4 completed focus sessions)
      const totalWorkDone = sessions.filter(s => s.completed && s.mode === 'work').length + 1;
      const nextMode: TimerMode = totalWorkDone % 4 === 0 ? 'longBreak' : 'break';
      
      setMode(nextMode);
      
      if (settings.autoStartBreaks) {
        // Delay slightly to allow completion chime to play nicely, then restart
        setTimeout(() => {
          setTimerState('running');
          if (settings.soundEnabled) {
            playFocusStartChime(settings.soundVolume);
          }
        }, 1000);
      }
    } else {
      // Break session finished, return back to Work focus
      setMode('work');
      
      if (settings.autoStartFocus) {
        setTimeout(() => {
          setTimerState('running');
          if (settings.soundEnabled) {
            playFocusStartChime(settings.soundVolume);
          }
        }, 1000);
      }
    }
  };

  // --- Timer Operations ---
  const toggleTimer = () => {
    if (timerState === 'running') {
      setTimerState('paused');
    } else {
      setTimerState('running');
      // If resuming focus, trigger a start feedback tone
      if (timerState === 'idle' && settings.soundEnabled) {
        playFocusStartChime(settings.soundVolume);
      }
    }
  };

  const resetTimer = () => {
    setTimerState('idle');
    const initialSeconds = getDurationForMode(mode) * 60;
    setTimeLeft(initialSeconds);
    setTotalDuration(initialSeconds);
    sessionStartTimeRef.current = null;
  };

  const skipTimer = () => {
    if (confirm('确认跳过当前的计时时段吗？该段记录将不会计入完整专注统计。')) {
      const activeTask = tasks.find(t => t.id === activeTaskId);
      const abortedDuration = Math.round((totalDuration - timeLeft) / 60);

      // Log an uncompleted/skipped session if it was work and had elapsed time
      if (mode === 'work' && abortedDuration > 0) {
        const skippedSession: FocusSession = {
          id: Math.random().toString(36).substring(2, 9),
          startTime: sessionStartTimeRef.current || new Date().toISOString(),
          duration: abortedDuration,
          mode: 'work',
          taskName: activeTask ? activeTask.title : '自主专注',
          completed: false,
        };
        setSessions(prev => [...prev, skippedSession]);
      }

      setTimerState('idle');
      sessionStartTimeRef.current = null;

      // Swap modes directly
      if (mode === 'work') {
        const totalWorkDone = sessions.filter(s => s.completed && s.mode === 'work').length;
        setMode(totalWorkDone % 4 === 0 && totalWorkDone > 0 ? 'longBreak' : 'break');
      } else {
        setMode('work');
      }
    }
  };

  const setManualMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimerState('idle');
    const mins = getDurationForMode(newMode);
    setTimeLeft(mins * 60);
    setTotalDuration(mins * 60);
    sessionStartTimeRef.current = null;
  };

  // --- Task Manager CRUD Operations ---
  const handleAddTask = (title: string, estPomodoros: number) => {
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      completed: false,
      estimatedPomodoros: estPomodoros,
      completedPomodoros: 0,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleToggleCompleteTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const nextCompleted = !task.completed;
        // If the completed task was currently the focused active task, un-focus it
        if (nextCompleted && activeTaskId === taskId) {
          setActiveTaskId(null);
        }
        return { ...task, completed: nextCompleted };
      }
      return task;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const handleClearCompletedTasks = () => {
    setTasks(prev => prev.filter(t => !t.completed));
  };

  // --- Theme Warm Color Tone Mapper ---
  const getThemeBackgroundGradient = () => {
    switch (mode) {
      case 'work':
        return 'bg-[#FDF8F3]';
      case 'break':
        return 'bg-[#F8F9F3]'; // Subtle sage beige tint
      case 'longBreak':
        return 'bg-[#FBF6EE]'; // Subtle sand beige tint
      default:
        return 'bg-[#FDF8F3]';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeBackgroundGradient()} transition-colors duration-1000 py-10 px-4 md:px-8 font-sans antialiased text-[#2D241E] flex flex-col justify-between`}>
      
      {/* Container wrapper */}
      <div className="max-w-6xl mx-auto w-full space-y-8 flex-1">
        
        {/* Modern Warm Title Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#F2EAE1] pb-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#D97757] text-white flex items-center justify-center shadow-md shadow-[#D97757]/10">
              <Timer className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#2D241E] flex items-center gap-2">
                温暖番茄钟
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F9F5F1] text-[#D97757] border border-[#E5DACE]/60">v1.2</span>
              </h1>
              <p className="text-xs text-[#8C8279] font-medium">在饱含阳光的暖色里，优雅而科学地开启高效专注</p>
            </div>
          </div>
          
          {/* Quick Info Board */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#F2EAE1] text-xs font-semibold text-[#2D241E] shadow-sm">
              <Flame className="h-4 w-4 text-[#D97757]" />
              <span>今日已专注: {sessions.filter(s => s.completed && s.mode === 'work' && new Date(s.startTime).toDateString() === new Date().toDateString()).length} 个番茄钟</span>
            </div>
          </div>
        </header>

        {/* Content Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Interactive Pomodoro Timer Circle Ring (Span 5) */}
          <div className="lg:col-span-5 h-full">
            <TimerRing
              mode={mode}
              state={timerState}
              timeLeft={timeLeft}
              totalDuration={totalDuration}
              onToggleTimer={toggleTimer}
              onResetTimer={resetTimer}
              onSkipTimer={skipTimer}
              onSetMode={setManualMode}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>

          {/* Center-Right: Task Single Task Selector and Manager (Span 7) */}
          <div className="lg:col-span-7 h-full">
            <TaskSelector
              tasks={tasks}
              activeTaskId={activeTaskId}
              onSelectTask={setActiveTaskId}
              onAddTask={handleAddTask}
              onToggleCompleteTask={handleToggleCompleteTask}
              onDeleteTask={handleDeleteTask}
              onClearCompletedTasks={handleClearCompletedTasks}
            />
          </div>

          {/* Statistics Section spanning full width under controls */}
          <section className="lg:col-span-12 pt-4">
            <StatsDashboard
              sessions={sessions}
              onClearHistory={() => setSessions([])}
            />
          </section>
        </main>
      </div>

      {/* Settings Modal Component */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* Footer copyright */}
      <footer className="w-full text-center mt-12 border-t border-[#F2EAE1] pt-6 text-[#8C8279] text-xs font-medium space-y-1">
        <p>© 2026 温暖番茄钟 · 自选专注时长 · 自动周期切换</p>
        <p className="text-[10px] text-[#8C8279]/60">使用 Web Audio API 原生合成音，告别延迟；配合 LocalStorage 安全留存数据</p>
      </footer>
    </div>
  );
}
