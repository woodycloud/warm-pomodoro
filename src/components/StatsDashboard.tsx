import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Clock, Flame, Award, Calendar, ListFilter, Trash2, Heart, Sparkles } from 'lucide-react';
import { FocusSession, TimerMode } from '../types';
import { playClickSound } from '../lib/audio';

interface StatsDashboardProps {
  sessions: FocusSession[];
  onClearHistory: () => void;
}

export default function StatsDashboard({ sessions, onClearHistory }: StatsDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'work' | 'break'>('all');

  // Compute stats
  const completedWorkSessions = sessions.filter(s => s.completed && s.mode === 'work');
  const completedBreakSessions = sessions.filter(s => s.completed && (s.mode === 'break' || s.mode === 'longBreak'));
  
  const totalFocusMinutes = completedWorkSessions.reduce((acc, s) => acc + s.duration, 0);
  
  // Calculate today's focus stats
  const todayStr = new Date().toDateString();
  const sessionsToday = completedWorkSessions.filter(s => new Date(s.startTime).toDateString() === todayStr);
  const focusMinutesToday = sessionsToday.reduce((acc, s) => acc + s.duration, 0);

  // Compute daily history for the last 7 days
  const getPast7DaysData = () => {
    const data = [];
    const daysName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysName[d.getDay()];
      const dateString = d.toDateString();
      
      const daySessions = completedWorkSessions.filter(s => new Date(s.startTime).toDateString() === dateString);
      const count = daySessions.length;
      const minutes = daySessions.reduce((acc, s) => acc + s.duration, 0);
      
      data.push({
        dayName,
        date: d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        count,
        minutes,
        isToday: i === 0
      });
    }
    return data;
  };

  const chartData = getPast7DaysData();
  const maxCount = Math.max(...chartData.map(d => d.count), 4); // default minimum scaling factor

  // Streak calculation (simplified client-side consecutive days focused)
  const calculateStreak = () => {
    if (completedWorkSessions.length === 0) return 0;
    
    const uniqueDates = Array.from(
      new Set(completedWorkSessions.map(s => new Date(s.startTime).toDateString()))
    ).map(d => new Date(d));
    
    // Sort descending
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const latestDate = uniqueDates[0];
    latestDate.setHours(0,0,0,0);
    
    // If no session today or yesterday, streak is broken
    const oneDay = 24 * 60 * 60 * 1000;
    const diff = today.getTime() - latestDate.getTime();
    
    if (diff > oneDay) return 0;
    
    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = uniqueDates[i];
      const next = uniqueDates[i + 1];
      const timeDiff = current.getTime() - next.getTime();
      
      if (timeDiff === oneDay) {
        streak++;
      } else if (timeDiff > oneDay) {
        break; // streak ended
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  // Filter sessions
  const filteredSessions = [...sessions]
    .filter(s => {
      if (filter === 'all') return true;
      if (filter === 'work') return s.mode === 'work';
      return s.mode === 'break' || s.mode === 'longBreak';
    })
    .reverse(); // Newest first

  const modeLabels: Record<TimerMode, string> = {
    work: '工作',
    break: '短休',
    longBreak: '长休'
  };

  return (
    <div className="space-y-6">
      {/* Overview Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Daily Pomodoros */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-3xl p-5 bg-[#D97757] text-white shadow-sm flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FDF8F3]/90 uppercase tracking-wider">今日番茄</span>
            <div className="h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-sans leading-none">{sessionsToday.length}</span>
              <span className="text-xs text-[#FDF8F3]/90">个</span>
            </div>
            <p className="text-[10px] text-[#FDF8F3]/80 mt-1 font-medium">累计专注 {focusMinutesToday} 分钟</p>
          </div>
        </motion.div>

        {/* Card 2: Total Time */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-3xl p-5 bg-[#848D72] text-white shadow-sm flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#FDF8F3]/90 uppercase tracking-wider">累计总时长</span>
            <div className="h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold leading-none">{totalFocusMinutes}</span>
              <span className="text-xs text-[#FDF8F3]/90">分钟</span>
            </div>
            <p className="text-[10px] text-[#FDF8F3]/80 mt-1 font-medium">共计 {completedWorkSessions.length} 次专注</p>
          </div>
        </motion.div>

        {/* Card 3: Streaks */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-3xl p-5 bg-white border border-[#F2EAE1] shadow-sm flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C8279] uppercase tracking-wider">专注极速</span>
            <div className="h-8 w-8 rounded-xl bg-[#FDF8F3] flex items-center justify-center border border-[#F2EAE1]">
              <Flame className="h-5 w-5 text-[#D97757]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[#2D241E] leading-none">{streak}</span>
              <span className="text-xs text-[#8C8279]">天</span>
            </div>
            <p className="text-[10px] text-[#8C8279] mt-1 font-medium">
              {streak > 0 ? '正在保持连胜中！🔥' : '今天开启新征程！🌱'}
            </p>
          </div>
        </motion.div>

        {/* Card 4: Break Ratio */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-3xl p-5 bg-white border border-[#F2EAE1] shadow-sm flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C8279] uppercase tracking-wider">完成指标</span>
            <div className="h-8 w-8 rounded-xl bg-[#F9F5F1] flex items-center justify-center border border-[#F2EAE1]">
              <Sparkles className="h-5 w-5 text-[#848D72]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[#2D241E] leading-none">
                {completedWorkSessions.length + completedBreakSessions.length}
              </span>
              <span className="text-xs text-[#8C8279]">次任务</span>
            </div>
            <p className="text-[10px] text-[#8C8279] mt-1 font-medium">
              休息过 {completedBreakSessions.length} 次
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Stats Layout: Trend Chart + Focus History Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Interactive SVG 7-Day Bar Chart */}
        <div className="lg:col-span-2 rounded-[40px] border border-[#F2EAE1] bg-white p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#D97757]" />
              <div>
                <h4 className="text-base font-bold text-[#2D241E]">近 7 日专注分布</h4>
                <p className="text-xs text-[#8C8279]">每日完成的番茄钟数量</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#8C8279]">
              <Calendar className="h-3.5 w-3.5" />
              <span>最近一周</span>
            </div>
          </div>

          {/* Interactive Bar Chart Container */}
          <div className="flex-1 flex items-end justify-between gap-2 h-48 pt-4 pb-2 border-b border-[#F2EAE1]">
            {chartData.map((d, idx) => {
              const heightPercent = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-2 bg-[#2D241E] text-white rounded-xl px-2.5 py-1.5 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 flex flex-col items-center shadow-md whitespace-nowrap">
                    <span>{d.count} 个番茄 (🍅)</span>
                    <span className="text-stone-300 text-[9px] font-medium">{d.minutes} 分钟</span>
                    {/* Triangle pointer */}
                    <div className="w-1.5 h-1.5 bg-[#2D241E] rotate-45 mt-0.5 -mb-1"></div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full max-w-[32px] bg-[#F9F5F1] rounded-t-xl h-full flex items-end overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent || 6}%` }} // small bar height as base if 0
                      transition={{ type: 'spring', damping: 15, delay: idx * 0.05 }}
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        d.count === 0 
                          ? 'bg-[#E5DACE]/40 group-hover:bg-[#E5DACE]/60' 
                          : d.isToday 
                            ? 'bg-gradient-to-t from-[#D97757] to-[#E38F75] shadow-sm' 
                            : 'bg-gradient-to-t from-[#D19E63]/80 to-[#E0B88F]/80 group-hover:from-[#D19E63] group-hover:to-[#E0B88F]'
                      }`}
                    />
                  </div>

                  {/* Day labels */}
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-semibold ${d.isToday ? 'text-[#D97757] font-bold' : 'text-[#8C8279]'}`}>
                      {d.dayName}
                    </p>
                    <p className="text-[9px] text-[#8C8279]/70">{d.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-[#8C8279] mt-3 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97757]" />
              今天 (Today)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D19E63]" />
              过往日期
            </span>
            <span>注: 鼠标悬停查看详细分钟数</span>
          </div>
        </div>

        {/* Column 3: Focus History Log with filter */}
        <div className="rounded-[40px] border border-[#F2EAE1] bg-white p-8 shadow-sm flex flex-col h-[324px]">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F2EAE1]">
            <div className="flex items-center gap-2">
              <ListFilter className="h-5 w-5 text-[#848D72]" />
              <h4 className="text-base font-bold text-[#2D241E]">历史足迹</h4>
            </div>

            {sessions.length > 0 && (
              <button
                onClick={() => {
                  playClickSound(0.3);
                  if(confirm('确认清空所有历史记录吗？')) {
                    onClearHistory();
                  }
                }}
                className="p-1.5 rounded-full text-[#8C8279] hover:text-[#D97757] hover:bg-[#FDF8F3] transition-colors"
                title="清除所有历史"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mode Filters */}
          <div className="flex gap-1.5 mb-3">
            {(['all', 'work', 'break'] as const).map(type => (
              <button
                key={type}
                onClick={() => {
                  playClickSound(0.2);
                  setFilter(type);
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === type
                    ? 'bg-[#D97757] text-white font-bold'
                    : 'bg-[#F9F5F1] hover:bg-[#F2EAE1] text-[#8C8279]'
                }`}
              >
                {type === 'all' ? '全部' : type === 'work' ? '工作' : '休息'}
              </button>
            ))}
          </div>

          {/* History Scroll List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            <AnimatePresence initial={false}>
              {filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-[#8C8279]/50">
                  <Calendar className="h-8 w-8 mb-1 opacity-60" />
                  <p className="text-xs font-semibold">暂无相关的专注历史</p>
                </div>
              ) : (
                filteredSessions.map((session, idx) => {
                  const sTime = new Date(session.startTime);
                  const formattedTime = sTime.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const formattedDate = sTime.toLocaleDateString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit'
                  });

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                      className="p-3 rounded-3xl border border-[#F2EAE1] bg-[#FDF8F3]/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                        {/* Bullet color */}
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          session.completed 
                            ? session.mode === 'work' 
                              ? 'bg-[#D97757] shadow-sm shadow-[#D97757]/20' 
                              : 'bg-[#848D72] shadow-sm shadow-[#848D72]/20'
                            : 'bg-[#E5DACE]'
                        }`} />
                        <div className="overflow-hidden flex-1">
                          <p className="font-semibold text-[#2D241E] truncate">
                            {session.mode === 'work' ? session.taskName || '专注时段' : modeLabels[session.mode]}
                          </p>
                          <p className="text-[10px] text-[#8C8279] font-medium">
                            {formattedDate} {formattedTime} · {session.duration} 分钟
                          </p>
                        </div>
                      </div>
                      
                      {/* Status Chip */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        session.completed 
                          ? session.mode === 'work'
                            ? 'bg-[#FDF8F3] text-[#D97757] border border-[#E5DACE]/40'
                            : 'bg-[#848D72]/10 text-[#848D72]'
                          : 'bg-[#F9F5F1] text-[#8C8279]'
                      }`}>
                        {session.completed ? '已完成' : '已跳过'}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Footer message / Encouraging Quote */}
      <div className="p-6 rounded-[30px] bg-[#F9F5F1] border border-[#F2EAE1] flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#F2EAE1] text-[#D97757]">
          <Heart className="h-5 w-5 fill-[#D97757]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#2D241E]">专注生活，热爱当下</p>
          <p className="text-xs text-[#8C8279] mt-0.5 leading-relaxed">番茄工作法（Pomodoro Technique）能有效帮助你提高专注力，保持高效，并预防心智疲惫。</p>
        </div>
      </div>
    </div>
  );
}
