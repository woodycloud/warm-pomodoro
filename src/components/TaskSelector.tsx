import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Target, Circle, CheckCircle, Trash2, Award } from 'lucide-react';
import { Task } from '../types';
import { playClickSound } from '../lib/audio';

interface TaskSelectorProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onAddTask: (title: string, estPomodoros: number) => void;
  onToggleCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onClearCompletedTasks: () => void;
}

export default function TaskSelector({
  tasks,
  activeTaskId,
  onSelectTask,
  onAddTask,
  onToggleCompleteTask,
  onDeleteTask,
  onClearCompletedTasks,
}: TaskSelectorProps) {
  const [newTitle, setNewTitle] = useState('');
  const [estPomodoros, setEstPomodoros] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const activeTask = tasks.find(t => t.id === activeTaskId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), estPomodoros);
    setNewTitle('');
    setEstPomodoros(1);
    setIsAdding(false);
    playClickSound(0.4);
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="rounded-[40px] border border-[#F2EAE1] bg-white p-8 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-[#F2EAE1] pb-3">
        <div>
          <h3 className="text-lg font-bold text-[#2D241E] flex items-center gap-2">
            <Target className="h-5 w-5 text-[#848D72]" />
            待办与聚焦
          </h3>
          <p className="text-xs text-[#8C8279]">选择一个任务并保持单线程高效</p>
        </div>

        {completedCount > 0 && (
          <button
            onClick={() => {
              playClickSound(0.3);
              onClearCompletedTasks();
            }}
            className="text-xs text-[#8C8279] hover:text-[#D97757] font-semibold hover:bg-[#F9F5F1] px-2.5 py-1.5 rounded-full transition-colors"
          >
            清除已完成
          </button>
        )}
      </div>

      {/* Selected Task Highlight Banner */}
      <div className="mb-4">
        {activeTask ? (
          <motion.div
            layoutId="activeTaskHighlight"
            className="p-4 rounded-3xl bg-[#F9F5F1] border border-[#F2EAE1] flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97757] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D97757]"></span>
              </span>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-[#D97757] uppercase tracking-wider">当前聚焦任务</p>
                <p className="text-sm font-semibold text-[#2D241E] truncate">{activeTask.title}</p>
              </div>
            </div>
            <button
              onClick={() => {
                playClickSound(0.3);
                onSelectTask(null);
              }}
              className="text-xs bg-white text-[#D97757] hover:bg-[#FDF8F3] px-3 py-2 rounded-full font-bold shadow-sm border border-[#E5DACE] transition-colors"
            >
              取消聚焦
            </button>
          </motion.div>
        ) : (
          <div className="p-4 rounded-3xl border border-dashed border-[#E5DACE] text-center bg-[#FDF8F3]/50">
            <p className="text-sm text-[#8C8279] font-semibold">您还没选择专注目标</p>
            <p className="text-xs text-[#8C8279]/70 mt-0.5">从下方列表点击一个任务开始专注吧</p>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto max-h-[220px] min-h-[140px] pr-1 space-y-2 mb-4">
        <AnimatePresence initial={false}>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 text-[#8C8279]/50"
            >
              <Award className="h-8 w-8 mb-1 opacity-60" />
              <p className="text-xs font-semibold">暂无待办，添加一个开始吧！</p>
            </motion.div>
          ) : (
            tasks.map(task => {
              const isSelected = task.id === activeTaskId;
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`group flex items-center justify-between p-3.5 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F9F5F1] border-[#E5DACE] shadow-sm'
                      : 'bg-white hover:bg-[#F9F5F1]/30 border-[#F2EAE1] hover:border-[#E5DACE]'
                  }`}
                  onClick={() => {
                    if (!task.completed) {
                      playClickSound(0.3);
                      onSelectTask(isSelected ? null : task.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {/* Checkbox button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playClickSound(0.4);
                        onToggleCompleteTask(task.id);
                      }}
                      className="text-[#E5DACE] hover:text-[#848D72] transition-colors flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle className="h-5 w-5 text-[#848D72] fill-[#848D72]/10" />
                      ) : (
                        <Circle className="h-5 w-5 text-[#E5DACE] group-hover:border-[#848D72] transition-all" />
                      )}
                    </button>

                    <div className="overflow-hidden flex-1">
                      <p className={`text-sm font-semibold truncate ${
                        task.completed ? 'text-[#8C8279] line-through' : 'text-[#2D241E]'
                      }`}>
                        {task.title}
                      </p>
                      {/* Pomodoro count indicators */}
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-[#8C8279] font-bold mr-1">
                          番茄数: {task.completedPomodoros}/{task.estimatedPomodoros}
                        </span>
                        {Array.from({ length: task.estimatedPomodoros }).map((_, i) => (
                          <span
                            key={i}
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              i < task.completedPomodoros
                                ? 'bg-[#D97757] shadow-sm shadow-[#D97757]/20'
                                : 'bg-[#E5DACE]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right hand delete option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound(0.3);
                      onDeleteTask(task.id);
                    }}
                    className="p-1.5 rounded-full text-[#E5DACE] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Task Creation Form */}
      <div>
        {isAdding ? (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3.5 p-4.5 bg-[#F9F5F1] rounded-3xl border border-[#F2EAE1]"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8C8279] uppercase tracking-wider">任务名称</label>
              <input
                type="text"
                placeholder="正在构思什么呢..."
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-white text-sm text-[#2D241E] rounded-2xl px-3.5 py-2.5 border border-[#E5DACE] focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/20"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8C8279] uppercase tracking-wider block">预计番茄数 (🍅)</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        playClickSound(0.2);
                        setEstPomodoros(num);
                      }}
                      className={`w-7 h-7 text-xs font-bold rounded-xl transition-all border ${
                        estPomodoros === num
                          ? 'bg-[#D97757] border-[#D97757] text-white shadow-sm'
                          : 'bg-white border-[#E5DACE] hover:bg-[#FDF8F3] text-[#8C8279]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end gap-2 self-end">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound(0.2);
                    setIsAdding(false);
                  }}
                  className="px-3.5 py-2 rounded-2xl text-xs font-semibold text-[#8C8279] hover:bg-[#E5DACE]/40 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold bg-[#D97757] hover:bg-[#C46648] text-white disabled:opacity-45 shadow-sm transition-all"
                >
                  添加
                </button>
              </div>
            </div>
          </motion.form>
        ) : (
          <button
            onClick={() => {
              playClickSound(0.3);
              setIsAdding(true);
            }}
            className="w-full py-3.5 rounded-3xl border border-dashed border-[#E5DACE] hover:border-[#D97757] hover:bg-[#FDF8F3] text-[#8C8279] hover:text-[#D97757] text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="h-4 w-4" />
            添加新任务
          </button>
        )}
      </div>
    </div>
  );
}
