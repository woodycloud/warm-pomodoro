export type TimerState = 'idle' | 'running' | 'paused';
export type TimerMode = 'work' | 'break' | 'longBreak';

export interface FocusSession {
  id: string;
  startTime: string; // ISO string
  duration: number; // in minutes
  mode: TimerMode;
  taskName: string;
  completed: boolean;
}

export interface Settings {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: string;
}
