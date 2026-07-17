import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { TimerMode, TimerState } from '../types';
import { playClickSound } from '../lib/audio';

interface TimerRingProps {
  mode: TimerMode;
  state: TimerState;
  timeLeft: number; // in seconds
  totalDuration: number; // in seconds
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipTimer: () => void;
  onSetMode: (mode: TimerMode) => void;
  onOpenSettings: () => void;
}

export default function TimerRing({
  mode,
  state,
  timeLeft,
  totalDuration,
  onToggleTimer,
  onResetTimer,
  onSkipTimer,
  onSetMode,
  onOpenSettings,
}: TimerRingProps) {
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG circular progress calculation
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = circumference - progress * circumference;

  // Color configurations based on current mode
  const themeColors = {
    work: {
      accent: 'text-[#D97757]',
      accentBg: 'bg-[#D97757]',
      accentLight: 'bg-[#FDF8F3] text-[#D97757]',
      accentBorder: 'border-[#E5DACE]',
      gradient: 'from-[#D97757] to-[#C46648]',
      glow: 'shadow-[#D97757]/20',
      trail: 'stroke-[#F2EAE1]',
      progress: 'stroke-[#D97757]',
      title: '专注中',
      desc: '心无旁骛，高效产出',
      bgGradient: 'bg-[#D97757]/10'
    },
    break: {
      accent: 'text-[#848D72]',
      accentBg: 'bg-[#848D72]',
      accentLight: 'bg-[#848D72]/10 text-[#848D72]',
      accentBorder: 'border-[#F2EAE1]',
      gradient: 'from-[#848D72] to-[#737C61]',
      glow: 'shadow-[#848D72]/20',
      trail: 'stroke-[#F2EAE1]',
      progress: 'stroke-[#848D72]',
      title: '短休中',
      desc: '舒缓呼吸，伸个懒腰',
      bgGradient: 'bg-[#848D72]/10'
    },
    longBreak: {
      accent: 'text-[#D19E63]',
      accentBg: 'bg-[#D19E63]',
      accentLight: 'bg-[#D19E63]/10 text-[#D19E63]',
      accentBorder: 'border-[#F2EAE1]',
      gradient: 'from-[#D19E63] to-[#B8874E]',
      glow: 'shadow-[#D19E63]/20',
      trail: 'stroke-[#F2EAE1]',
      progress: 'stroke-[#D19E63]',
      title: '长休中',
      desc: '离开电脑，喝杯温水',
      bgGradient: 'bg-[#D19E63]/10'
    }
  };

  const currentTheme = themeColors[mode];

  // Micro-click feedback
  const handleModeSwitch = (newMode: TimerMode) => {
    if (newMode !== mode) {
      playClickSound(0.3);
      onSetMode(newMode);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[40px] border border-[#F2EAE1] shadow-sm">
      
      {/* Settings Gear & Mode Tabs */}
      <div className="w-full flex justify-between items-center mb-6">
        {/* Title Indicator */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F9F5F1] border border-[#F2EAE1]">
          <Brain className={`h-4 w-4 ${currentTheme.accent}`} />
          <span className="text-xs font-bold text-[#8C8279] tracking-wider uppercase">{currentTheme.title}</span>
        </div>

        {/* Setting Gear */}
        <button
          onClick={() => {
            playClickSound(0.3);
            onOpenSettings();
          }}
          className="p-2.5 rounded-full bg-[#F9F5F1] hover:bg-white text-[#8C8279] hover:text-[#D97757] border border-[#F2EAE1] transition-all shadow-sm"
          title="参数设置"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Segment Mode Selector */}
      <div className="flex bg-[#F9F5F1] p-1.5 rounded-full w-full max-w-[340px] mb-8 relative border border-[#F2EAE1]">
        {(['work', 'break', 'longBreak'] as const).map((tMode) => {
          const isActive = mode === tMode;
          const label = tMode === 'work' ? 'Focus' : tMode === 'break' ? 'Short Break' : 'Long Break';
          return (
            <button
              key={tMode}
              onClick={() => handleModeSwitch(tMode)}
              className="flex-1 text-center py-2.5 rounded-full text-xs font-semibold relative z-10 transition-colors"
              style={{
                color: isActive ? '#FFFFFF' : '#8C8279'
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
                  className={`absolute inset-0 ${currentTheme.accentBg} rounded-full shadow-md -z-10`}
                />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* Main Animated Timer Circular Ring */}
      <div className="relative flex items-center justify-center mb-8 select-none">
        
        {/* Pulse Background Glow (only when running) */}
        {state === 'running' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0.15 }}
            animate={{ scale: 1.12, opacity: 0 }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: 'easeOut'
            }}
            className={`absolute w-72 h-72 md:w-80 md:h-80 rounded-full ${currentTheme.bgGradient} -z-10`}
          />
        )}

        {/* SVG Circle Timer Progress Ring */}
        <svg className="w-68 h-68 md:w-76 md:h-76 transform -rotate-90">
          {/* Track Circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className={`fill-transparent ${currentTheme.trail} stroke-[8]`}
          />
          {/* Animated Countdown Progress */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            className={`fill-transparent ${currentTheme.progress} stroke-[8]`}
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.3, ease: 'linear' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Time Text inside circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[#8C8279] font-sans text-xs tracking-[0.15em] uppercase font-bold mb-1">
            {state === 'running' ? 'Focusing' : state === 'paused' ? 'Paused' : 'Ready'}
          </span>
          
          <motion.h1 
            key={timeLeft}
            initial={{ scale: 0.98, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[80px] md:text-[90px] font-light leading-none tracking-tighter text-[#2D241E] font-sans"
          >
            {formatTime(timeLeft)}
          </motion.h1>

          <p className="text-[#8C8279] text-xs mt-2 font-medium tracking-wide max-w-[140px] truncate">
            {currentTheme.desc}
          </p>
        </div>
      </div>

      {/* Timer Dynamic Controls */}
      <div className="flex items-center gap-5 justify-center">
        {/* Reset Button */}
        <button
          onClick={() => {
            playClickSound(0.3);
            onResetTimer();
          }}
          disabled={state === 'idle'}
          className="p-4 rounded-full border-2 border-[#F2EAE1] text-[#8C8279] hover:border-[#D97757] hover:text-[#D97757] bg-white disabled:opacity-35 disabled:pointer-events-none transition-all hover:scale-105 shadow-sm"
          title="重置计时"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        {/* Primary Play / Pause Action Button */}
        <button
          onClick={() => {
            playClickSound(0.4);
            onToggleTimer();
          }}
          className={`px-12 py-4 bg-[#D97757] text-white rounded-full text-lg font-semibold shadow-lg shadow-[#D97757]/20 hover:bg-[#C46648] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2`}
          title={state === 'running' ? '暂停' : '启动'}
        >
          <AnimatePresence mode="wait">
            {state === 'running' ? (
              <motion.div
                key="pause-icon"
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                <Pause className="h-5 w-5 fill-white text-white" />
                <span>Pause</span>
              </motion.div>
            ) : (
              <motion.div
                key="play-icon"
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                <Play className="h-5 w-5 fill-white text-white" />
                <span>Start</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Skip Timer Button */}
        <button
          onClick={() => {
            playClickSound(0.3);
            onSkipTimer();
          }}
          disabled={state === 'idle'}
          className="p-4 rounded-full border-2 border-[#F2EAE1] text-[#8C8279] hover:border-[#D97757] hover:text-[#D97757] bg-white disabled:opacity-35 disabled:pointer-events-none transition-all hover:scale-105 shadow-sm"
          title="跳过此阶段"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
