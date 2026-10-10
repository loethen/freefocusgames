'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from "sonner";
import { Play, Pause, RotateCcw, Settings, Trash2, ArrowRightToLine } from "lucide-react";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";
import { Howl } from 'howler';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trackStartGame, trackCompleteGame } from '@/lib/analytics';

enum TimerMode {
  FOCUS = 'focus',
  SHORT_BREAK = 'shortBreak',
  LONG_BREAK = 'longBreak'
}

interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  playSound: boolean;
}

interface TodayStats {
  date: string;
  completedSessions: number;
  totalFocusTime: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: true,
  playSound: true
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function PomodoroTimer() {
  const t = useTranslations('games.pomodoroTimer.gameUI');

  // Settings
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Timer state
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Session count (resets on page refresh - used for long/short break decision)
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);

  // Today's stats (persists, but resets each day)
  const [todayStats, setTodayStats] = useState<TodayStats>({
    date: getTodayDate(),
    completedSessions: 0,
    totalFocusTime: 0
  });

  const originalTitleRef = useRef<string>('');

  // Load saved data and settings
  useEffect(() => {
    originalTitleRef.current = document.title;

    // Load settings
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setTimeLeft(parsed.focusDuration * 60);
    }

    // Load today's stats
    const savedStats = localStorage.getItem('pomodoroTodayStats');
    if (savedStats) {
      const parsed: TodayStats = JSON.parse(savedStats);
      const today = getTodayDate();

      // Check if it's still today, otherwise reset
      if (parsed.date === today) {
        setTodayStats(parsed);
      } else {
        // New day, reset stats
        const newStats: TodayStats = {
          date: today,
          completedSessions: 0,
          totalFocusTime: 0
        };
        setTodayStats(newStats);
        localStorage.setItem('pomodoroTodayStats', JSON.stringify(newStats));
      }
    }

    return () => {
      document.title = originalTitleRef.current;
    };
  }, []); // Load settings only once

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);

    let duration: number;
    switch (newMode) {
      case TimerMode.FOCUS:
        duration = settings.focusDuration;
        break;
      case TimerMode.SHORT_BREAK:
        duration = settings.shortBreakDuration;
        break;
      case TimerMode.LONG_BREAK:
        duration = settings.longBreakDuration;
        break;
    }

    setTimeLeft(duration * 60);
  }, [settings]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);

    if (settings.playSound) {
      const sound = new Howl({
        src: ['/sounds/ready-tone.mp3']
      });
      sound.play();
    }

    // Send Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(t(mode === TimerMode.FOCUS ? 'focusComplete' : 'breakComplete'), {
          body: t(mode === TimerMode.FOCUS ? 'focusCompleteBody' : 'breakCompleteBody'),
          silent: false,
          requireInteraction: true, // Keep notification until user clicks it
          tag: 'pomodoro-timer' // Replace older notifications from this app
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (e) {
        console.error('Notification failed:', e);
      }
    } else {
      // Permission not granted or not supported, do nothing silently
    }

    if (mode === TimerMode.FOCUS) {
      const newSessionCount = sessionCompletedCount + 1;
      const newTodayStats: TodayStats = {
        ...todayStats,
        completedSessions: todayStats.completedSessions + 1,
        totalFocusTime: todayStats.totalFocusTime + settings.focusDuration
      };

      setSessionCompletedCount(newSessionCount);
      setTodayStats(newTodayStats);
      localStorage.setItem('pomodoroTodayStats', JSON.stringify(newTodayStats));

      // Track completion
      trackCompleteGame({
        game_id: 'pomodoro-timer',
        duration_ms: settings.focusDuration * 60 * 1000,
        score: newTodayStats.completedSessions
      });

      toast.success(t('focusComplete'));

      // Auto-switch to break and auto-start
      const breakMode = newSessionCount % settings.sessionsUntilLongBreak === 0
        ? TimerMode.LONG_BREAK
        : TimerMode.SHORT_BREAK;

      switchMode(breakMode);
      if (settings.autoStartBreaks) {
        setIsRunning(true); // Auto-start break
      }
    } else {
      toast.success(t('breakComplete'));
      // Switch to FOCUS mode but don't auto-start, wait for user
      switchMode(TimerMode.FOCUS);
    }
  }, [mode, settings, sessionCompletedCount, todayStats, t, switchMode]);

  // Web Worker Ref
  const workerRef = useRef<Worker | null>(null);
  const handleTimerCompleteRef = useRef(handleTimerComplete);

  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete;
  }, [handleTimerComplete]);

  // Initialize Web Worker
  useEffect(() => {
    const worker = new Worker(new URL('./pomodoro.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, timeLeft } = event.data;
      if (type === 'TICK') {
        setTimeLeft(timeLeft);
      } else if (type === 'COMPLETE') {
        handleTimerCompleteRef.current();
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Timer logic - controlled by worker now
  useEffect(() => {
    if (workerRef.current) {
      if (isRunning) {
        // Start the new mode or resume the current countdown.
        workerRef.current.postMessage({ type: 'START', duration: timeLeft });
      } else {
        workerRef.current.postMessage({ type: 'PAUSE' });
      }
    }
    // Each tick updates timeLeft without restarting the worker's interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode]); // Auto-start also needs to run when the mode changes while running.

  // Update tab title with countdown
  useEffect(() => {
    if (isRunning) {
      const modeText = mode === TimerMode.FOCUS ? '🎯 Focus' :
        mode === TimerMode.SHORT_BREAK ? '☕ Break' :
          '☕ Long Break';
      document.title = `${formatTime(timeLeft)} - ${modeText}`;
    } else {
      document.title = originalTitleRef.current;
    }
  }, [isRunning, timeLeft, mode]);

  /* Removed global useEffect for notification permission */

  /* Moved switchMode and handleTimerComplete up */

  const toggleTimer = async () => {
    if (!isRunning) {
      if ('Notification' in window && Notification.permission === 'default') {
        setShowPermissionDialog(true);
        return;
      }

      trackStartGame({
        game_id: 'pomodoro-timer',
        mode: mode
      });
    }
    setIsRunning(!isRunning);
  };

  const handlePermissionAllow = async () => {
    setShowPermissionDialog(false);
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
    // Start timer regardless of decision
    startGame();
  };

  const handlePermissionCancel = () => {
    setShowPermissionDialog(false);
    startGame();
  };

  const startGame = () => {
    trackStartGame({
      game_id: 'pomodoro-timer',
      mode: mode
    });
    setIsRunning(true);
  };

  const handleSkip = () => {
    if (mode === TimerMode.FOCUS) {
      const newSessionCount = sessionCompletedCount + 1;
      setSessionCompletedCount(newSessionCount);
      const breakMode = newSessionCount % settings.sessionsUntilLongBreak === 0
        ? TimerMode.LONG_BREAK
        : TimerMode.SHORT_BREAK;
      switchMode(breakMode);
    } else {
      switchMode(TimerMode.FOCUS);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    // Reset local state first
    let duration: number;
    switch (mode) {
      case TimerMode.FOCUS: duration = settings.focusDuration; break;
      case TimerMode.SHORT_BREAK: duration = settings.shortBreakDuration; break;
      case TimerMode.LONG_BREAK: duration = settings.longBreakDuration; break;
    }
    setTimeLeft(duration * 60);
    // Worker reset
    workerRef.current?.postMessage({ type: 'RESET', duration: duration * 60 });
  };

  const clearTodayStats = () => {
    const newStats: TodayStats = {
      date: getTodayDate(),
      completedSessions: 0,
      totalFocusTime: 0
    };
    setTodayStats(newStats);
    setSessionCompletedCount(0);
    localStorage.setItem('pomodoroTodayStats', JSON.stringify(newStats));
    toast.success(t('statsCleared'));
  };

  const saveSettings = (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));

    // Reset all state
    setIsRunning(false);
    setMode(TimerMode.FOCUS);
    setTimeLeft(newSettings.focusDuration * 60);

    setIsSettingsOpen(false);
    toast.success(t('settingsSaved'));
  };

  /* Moved formatTime up */

  const getProgress = (): number => {
    let totalSeconds: number;
    switch (mode) {
      case TimerMode.FOCUS:
        totalSeconds = settings.focusDuration * 60;
        break;
      case TimerMode.SHORT_BREAK:
        totalSeconds = settings.shortBreakDuration * 60;
        break;
      case TimerMode.LONG_BREAK:
        totalSeconds = settings.longBreakDuration * 60;
        break;
    }
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  const getModeColor = () => {
    switch (mode) {
      case TimerMode.FOCUS:
        return 'from-red-500 to-orange-500';
      case TimerMode.SHORT_BREAK:
        return 'from-green-500 to-teal-500';
      case TimerMode.LONG_BREAK:
        return 'from-blue-500 to-purple-500';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[600px] p-4 max-w-2xl mx-auto">
      {/* Settings Button - Top Right */}
      <div className="absolute top-4 right-4">
        <SettingsDialog
          settings={settings}
          onSave={saveSettings}
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      </div>

      {/* Timer Display */}
      <motion.div
        className="relative w-72 h-72 sm:w-96 sm:h-96 mb-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Progress Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 320 320">
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <motion.circle
            cx="160"
            cy="160"
            r="140"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 140}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 140 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 140 * (1 - getProgress() / 100) }}
            transition={{ duration: 1, ease: "linear" }}
            className={`bg-gradient-to-r ${getModeColor()}`}
            style={{
              stroke: mode === TimerMode.FOCUS ? 'rgb(239, 68, 68)' :
                mode === TimerMode.SHORT_BREAK ? 'rgb(34, 197, 94)' :
                  'rgb(59, 130, 246)'
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-5xl sm:text-7xl font-bold font-mono tabular-nums">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Mode label - positioned absolutely, not affecting layout */}
        <div className="absolute bottom-12 sm:bottom-16 left-0 right-0 text-center">
          <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground font-medium">
            {t(mode)}
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 px-4">
        <Button
          size="lg"
          onClick={toggleTimer}
          className="w-24 sm:w-28"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('pause')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('start')}
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={resetTimer}
          className="flex-shrink-0 px-4"
        >
          <RotateCcw className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">{t('reset')}</span>
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleSkip}
          className="flex-shrink-0 px-4"
        >
          <ArrowRightToLine className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">{t('skip')}</span>
        </Button>
      </div>

      {/* Today's Statistics - Compact */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground px-4">
        <span className="text-center">
          {t('todayLabel')}: <strong className="text-foreground">{todayStats.completedSessions}</strong> {t('sessions')} · <strong className="text-foreground">{todayStats.totalFocusTime}</strong> {t('minutes')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearTodayStats}
          className="h-7 px-2"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          {t('clear')}
        </Button>
      </div>


      <PermissionDialog
        isOpen={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onAllow={handlePermissionAllow}
        onCancel={handlePermissionCancel}
      />
    </div >
  );
}

function SettingsDialog({
  settings,
  onSave,
  isOpen,
  onOpenChange
}: {
  settings: PomodoroSettings;
  onSave: (settings: PomodoroSettings) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('games.pomodoroTimer.settings');
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    onSave(tempSettings);
  };

  const handleResetToDefault = () => {
    setTempSettings(DEFAULT_SETTINGS);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline">
          <Settings className="w-5 h-5 mr-2" />
          {t('title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="focusDuration">{t('focusDuration')}</Label>
            <Input
              id="focusDuration"
              type="number"
              min="0"
              max="100"
              value={tempSettings.focusDuration}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setTempSettings({
                  ...tempSettings,
                  focusDuration: Math.min(100, Math.max(0, val))
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortBreak">{t('shortBreakDuration')}</Label>
            <Input
              id="shortBreak"
              type="number"
              min="0"
              max="100"
              value={tempSettings.shortBreakDuration}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setTempSettings({
                  ...tempSettings,
                  shortBreakDuration: Math.min(100, Math.max(0, val))
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longBreak">{t('longBreakDuration')}</Label>
            <Input
              id="longBreak"
              type="number"
              min="0"
              max="100"
              value={tempSettings.longBreakDuration}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setTempSettings({
                  ...tempSettings,
                  longBreakDuration: Math.min(100, Math.max(0, val))
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessionsUntilLongBreak">{t('sessionsUntilLongBreak')}</Label>
            <Input
              id="sessionsUntilLongBreak"
              type="number"
              min="0"
              max="100"
              value={tempSettings.sessionsUntilLongBreak}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setTempSettings({
                  ...tempSettings,
                  sessionsUntilLongBreak: Math.min(100, Math.max(0, val))
                });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="autoStartBreaks">{t('autoStartBreaks')}</Label>
            <Switch
              id="autoStartBreaks"
              checked={tempSettings.autoStartBreaks}
              onCheckedChange={(checked) => setTempSettings({ ...tempSettings, autoStartBreaks: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="playSound">{t('playSound')}</Label>
            <Switch
              id="playSound"
              checked={tempSettings.playSound}
              onCheckedChange={(checked) => setTempSettings({ ...tempSettings, playSound: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('notificationPermissionTitle')}</Label>
            <div className="flex justify-end">
              <NotificationPermissionButton />
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={handleResetToDefault}>
            {t('resetToDefault')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave}>
              {t('save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
}

function NotificationPermissionButton() {
  const t = useTranslations('games.pomodoroTimer.settings');
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setMounted(true);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (!mounted || typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (permission === 'granted') {
    return (
      <Button type="button" variant="outline" className="text-green-600 border-green-200 bg-green-50" disabled>
        ✓ {t('notificationsEnabled')}
      </Button>
    );
  } else if (permission === 'denied') {
    return (
      <Button type="button" variant="outline" onClick={() => {
        toast.error(t('notificationPermissionDenied'));
      }}>
        {t('enableNotifications')}
      </Button>
    );
  } else {
    return (
      <Button type="button" variant="secondary" onClick={() => {
        toast(t('notificationPermissionRequest'));
        Notification.requestPermission().then(p => setPermission(p));
      }}>
        {t('enableNotifications')}
      </Button>
    );
  }
}

function PermissionDialog({
  isOpen,
  onOpenChange,
  onAllow,
  onCancel
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('games.pomodoroTimer.settings');
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('permissionDialogTitle')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>{t('permissionDialogBody')}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t('maybeLater')}
          </Button>
          <Button onClick={onAllow}>
            {t('allow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
