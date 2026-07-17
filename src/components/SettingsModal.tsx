import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Bell, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { Settings } from '../types';
import { playClickSound, playChime } from '../lib/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<Settings>({ ...settings });

  // Reset to initial settings whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settings });
    }
  }, [isOpen, settings]);

  const handleChange = (key: keyof Settings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    if (localSettings.soundEnabled) {
      playChime(localSettings.soundVolume);
    } else {
      playClickSound(localSettings.soundVolume);
    }
    onSave(localSettings);
    onClose();
  };

  const testAudio = () => {
    playChime(localSettings.soundVolume);
  };

  const resetToDefault = () => {
    playClickSound(localSettings.soundVolume);
    setLocalSettings({
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      autoStartFocus: false,
      soundEnabled: true,
      soundVolume: 0.5
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-md overflow-hidden rounded-[40px] border border-[#F2EAE1] bg-white p-8 shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F2EAE1] pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FDF8F3] text-[#D97757] border border-[#E5DACE]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2D241E]">计时器设置</h3>
                  <p className="text-xs text-[#8C8279]">个性化你的番茄工作流</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playClickSound(localSettings.soundVolume);
                  onClose();
                }}
                className="rounded-full p-2 text-[#8C8279] hover:bg-[#F9F5F1] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              {/* Duration Settings */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold tracking-wider text-[#8C8279] uppercase">时长设置 (分钟)</h4>
                
                {/* Work duration */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm text-[#2D241E] font-semibold">
                    <span>工作时间 (Work)</span>
                    <span className="text-[#D97757] font-bold">{localSettings.workDuration} 分钟</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={localSettings.workDuration}
                    onChange={(e) => handleChange('workDuration', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#F2EAE1] rounded-full appearance-none cursor-pointer accent-[#D97757]"
                  />
                </div>

                {/* Short Break duration */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm text-[#2D241E] font-semibold">
                    <span>短休时间 (Break)</span>
                    <span className="text-[#848D72] font-bold">{localSettings.breakDuration} 分钟</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={localSettings.breakDuration}
                    onChange={(e) => handleChange('breakDuration', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#F2EAE1] rounded-full appearance-none cursor-pointer accent-[#848D72]"
                  />
                </div>

                {/* Long Break duration */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm text-[#2D241E] font-semibold">
                    <span>长休时间 (Long Break)</span>
                    <span className="text-[#D19E63] font-bold">{localSettings.longBreakDuration} 分钟</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="45"
                    step="1"
                    value={localSettings.longBreakDuration}
                    onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#F2EAE1] rounded-full appearance-none cursor-pointer accent-[#D19E63]"
                  />
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold tracking-wider text-[#8C8279] uppercase">自动化流程</h4>
                
                {/* Auto start break */}
                <label className="flex items-center justify-between p-3.5 rounded-3xl border border-[#F2EAE1] bg-[#FDF8F3]/50 hover:bg-[#FDF8F3] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#F2EAE1] text-[#D19E63]">
                      <Zap className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#2D241E]">自动开启休息</p>
                      <p className="text-xs text-[#8C8279]">专注结束时自动倒计时休息</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.autoStartBreaks}
                    onChange={(e) => {
                      playClickSound(localSettings.soundVolume);
                      handleChange('autoStartBreaks', e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-[#E5DACE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#848D72]"></div>
                </label>

                {/* Auto start focus */}
                <label className="flex items-center justify-between p-3.5 rounded-3xl border border-[#F2EAE1] bg-[#FDF8F3]/50 hover:bg-[#FDF8F3] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#F2EAE1] text-[#848D72]">
                      <RefreshCw className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#2D241E]">自动开启下一次工作</p>
                      <p className="text-xs text-[#8C8279]">休息结束时自动倒计时工作</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.autoStartFocus}
                    onChange={(e) => {
                      playClickSound(localSettings.soundVolume);
                      handleChange('autoStartFocus', e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-[#E5DACE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#848D72]"></div>
                </label>
              </div>

              {/* Audio Settings */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold tracking-wider text-[#8C8279] uppercase">声效与反馈</h4>
                
                <label className="flex items-center justify-between p-3.5 rounded-3xl border border-[#F2EAE1] bg-[#FDF8F3]/50 hover:bg-[#FDF8F3] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#F2EAE1] text-[#D97757]">
                      <Bell className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#2D241E]">完成提示音</p>
                      <p className="text-xs text-[#8C8279]">倒计时结束时响起舒缓琴音</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.soundEnabled}
                    onChange={(e) => {
                      playClickSound(localSettings.soundVolume);
                      handleChange('soundEnabled', e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-[#E5DACE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#848D72]"></div>
                </label>

                {localSettings.soundEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2.5 p-4 rounded-3xl border border-[#F2EAE1] bg-[#FDF8F3]/30"
                  >
                    <div className="flex items-center justify-between text-xs text-[#8C8279] font-semibold">
                      <span>音量大小</span>
                      <button
                        onClick={testAudio}
                        className="text-[#D97757] hover:text-[#C46648] flex items-center gap-1 font-bold transition-colors"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        测试声音
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={localSettings.soundVolume}
                      onChange={(e) => handleChange('soundVolume', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#F2EAE1] rounded-full appearance-none cursor-pointer accent-[#D97757]"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 flex items-center gap-3 border-t border-[#F2EAE1] pt-4">
              <button
                type="button"
                onClick={resetToDefault}
                className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#8C8279] hover:bg-[#F9F5F1] hover:text-[#2D241E] transition-colors border border-[#E5DACE]"
              >
                恢复默认
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-2xl bg-[#D97757] hover:bg-[#C46648] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-[#D97757]/15 transition-all active:scale-[0.98]"
              >
                保存设置
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
