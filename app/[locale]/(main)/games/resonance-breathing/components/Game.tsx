'use client';

import { gameTabClass, gameTabsClass } from '@/lib/game-tab-styles'
import { useState, useEffect, useRef, useCallback } from 'react';
import LotusFlower, { BreathingPhase } from './LotusFlower';
import { useTranslations } from 'next-intl';
import { Play, Pause, Settings, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export type BreathingMode = 'resonance' | 'box' | '478' | 'custom';

interface BreathingPreset {
    inhale: number;
    holdIn: number;
    exhale: number;
    holdOut: number;
}

const PRESETS: Record<Exclude<BreathingMode, 'custom'>, BreathingPreset> = {
    resonance: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
    box: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
    '478': { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
};

interface GameSettings extends BreathingPreset {
    sessionDuration: number; // in minutes
}

interface GameProps {
    defaultMode?: BreathingMode;
}

export default function Game({ defaultMode = 'resonance' }: GameProps) {
    const t = useTranslations('games.resonanceBreathing');

    const [mode, setMode] = useState<BreathingMode>(defaultMode);
    const [phase, setPhase] = useState<BreathingPhase>('idle');
    const [isRunning, setIsRunning] = useState(false);
    const [cycleCount, setCycleCount] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showSettings, setShowSettings] = useState(true);
    const [isMusicEnabled, setIsMusicEnabled] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const getInitialSettings = (m: BreathingMode): GameSettings => {
        const preset = m === 'custom' ? PRESETS.resonance : PRESETS[m];
        return { ...preset, sessionDuration: 5 };
    };

    const [settings, setSettings] = useState<GameSettings>(getInitialSettings(defaultMode));

    // Initialize Audio
    useEffect(() => {
        audioRef.current = new Audio('/sounds/homecoming-tranquilium-main-version-25793-03-28.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Handle Music Playback
    useEffect(() => {
        if (!audioRef.current) return;

        if (isMusicEnabled) {
            audioRef.current.play().catch(error => {
                console.error("Audio playback failed:", error);
                setIsMusicEnabled(false);
            });
        } else {
            audioRef.current.pause();
        }
    }, [isMusicEnabled]);

    // Get current phase duration
    const getPhaseDuration = useCallback((p: BreathingPhase): number => {
        switch (p) {
            case 'inhale': return settings.inhale;
            case 'holdIn': return settings.holdIn;
            case 'exhale': return settings.exhale;
            case 'holdOut': return settings.holdOut;
            default: return 0;
        }
    }, [settings.inhale, settings.holdIn, settings.exhale, settings.holdOut]);

    // Determine the next phase, skipping phases with 0 duration
    const getNextPhase = useCallback((current: BreathingPhase): BreathingPhase => {
        const sequence: BreathingPhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];
        const currentIdx = sequence.indexOf(current);

        for (let i = 1; i <= 4; i++) {
            const nextIdx = (currentIdx + i) % 4;
            const nextPhase = sequence[nextIdx];
            if (getPhaseDuration(nextPhase) > 0) {
                return nextPhase;
            }
        }
        return 'inhale'; // fallback
    }, [getPhaseDuration]);

    const currentPhaseDuration = getPhaseDuration(phase);

    // Breathing cycle logic
    useEffect(() => {
        if (!isRunning) return;

        // Start with inhale
        if (phase === 'idle') {
            setPhase('inhale');
            return;
        }

        const duration = getPhaseDuration(phase);
        if (duration <= 0) {
            // Skip this phase immediately
            const next = getNextPhase(phase);
            if (next === 'inhale') setCycleCount(prev => prev + 1);
            setPhase(next);
            return;
        }

        const timer = setTimeout(() => {
            const next = getNextPhase(phase);
            // Count a cycle when we loop back to inhale
            if (next === 'inhale') {
                setCycleCount(prev => prev + 1);
            }
            setPhase(next);
        }, duration * 1000);

        return () => clearTimeout(timer);
    }, [isRunning, phase, getNextPhase, getPhaseDuration]);

    // Elapsed time tracker
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setElapsedTime(prev => {
                const newTime = prev + 1;
                if (newTime >= settings.sessionDuration * 60) {
                    setIsRunning(false);
                    setPhase('idle');
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, settings.sessionDuration]);

    const handleStart = () => {
        setIsRunning(true);
        setPhase('inhale');
    };

    const handlePause = () => {
        setIsRunning(false);
        setPhase('idle');
    };

    const handleReset = () => {
        setIsRunning(false);
        setPhase('idle');
        setCycleCount(0);
        setElapsedTime(0);
    };

    const handleModeChange = (newMode: BreathingMode) => {
        if (isRunning) return; // Prevent mode change while running
        setMode(newMode);
        if (newMode !== 'custom') {
            setSettings(s => ({ ...PRESETS[newMode], sessionDuration: s.sessionDuration }));
        }
        handleReset();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Compute breathing rate
    const totalCycleDuration = settings.inhale + settings.holdIn + settings.exhale + settings.holdOut;
    const breathingRate = totalCycleDuration > 0 ? (60 / totalCycleDuration).toFixed(1) : '0';

    // Mode navigation config — presets link to their pages, custom stays in-place
    const MODE_ROUTES: Record<string, string> = {
        resonance: '/games/resonance-breathing',
        box: '/games/box-breathing',
        '478': '/games/478-breathing',
    };

    const modeButtons: { key: BreathingMode; label: string }[] = [
        { key: 'resonance', label: t('ui.modeResonance') },
        { key: 'box', label: t('ui.modeBox') },
        { key: '478', label: t('ui.mode478') },
        { key: 'custom', label: t('ui.modeCustom') },
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-[600px]">

            {/* Mode Selector */}
            <div className={`relative z-10 flex flex-wrap justify-center gap-1 rounded-full p-1 mb-8 ${gameTabsClass}`}>
                {modeButtons.map(({ key, label }) => {
                    const isActive = mode === key;
                    const baseClass = `px-4 py-2 text-xs font-medium tracking-wide rounded-full transition-all
                        ${gameTabClass(isActive)}
                        ${isRunning ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                    `;

                    // Custom mode → in-page toggle button
                    if (key === 'custom') {
                        return (
                            <button
                                key={key}
                                onClick={() => handleModeChange(key)}
                                disabled={isRunning}
                                aria-pressed={isActive}
                                className={baseClass}
                            >
                                {label}
                            </button>
                        );
                    }

                    // Preset modes → always render as link (avoids hydration mismatch)
                    return (
                        <a key={key} href={MODE_ROUTES[key]} aria-current={isActive ? "page" : undefined} className={baseClass}>
                            {label}
                        </a>
                    );
                })}
            </div>

            {/* Pattern Display */}
            <div className="relative z-10 mb-4 text-center">
                <div className="text-xs text-gray-400 tracking-widest uppercase">
                    {settings.inhale}s {settings.holdIn > 0 && `· ${settings.holdIn}s`} · {settings.exhale}s {settings.holdOut > 0 && `· ${settings.holdOut}s`}
                </div>
            </div>

            {/* Stats bar - Clean Minimalist */}
            <div className="relative z-10 flex gap-12 mb-12 text-gray-900">
                <div className="text-center">
                    <div className="text-3xl font-light font-mono">{cycleCount}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{t('ui.cycles')}</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-light font-mono">{formatTime(elapsedTime)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{t('ui.elapsed')}</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-light font-mono">{settings.sessionDuration}:00</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{t('ui.target')}</div>
                </div>
            </div>

            {/* Lotus flower */}
            <div className="relative z-10 mb-16">
                <LotusFlower
                    phase={phase}
                    duration={currentPhaseDuration}
                />
            </div>

            {/* Controls - Black & White Only */}
            <div className="relative z-10 flex items-center gap-6">
                {!isRunning ? (
                    <button
                        onClick={handleStart}
                        className="flex items-center gap-2 px-10 py-3 bg-black text-white text-sm font-medium tracking-wide rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <Play className="w-4 h-4" fill="currentColor" />
                        {t('ui.start').toUpperCase()}
                    </button>
                ) : (
                    <button
                        onClick={handlePause}
                        className="flex items-center gap-2 px-10 py-3 bg-white text-black border border-black text-sm font-medium tracking-wide rounded-full hover:bg-gray-50 transition-all shadow-md"
                    >
                        <Pause className="w-4 h-4" fill="currentColor" />
                        {t('ui.pause').toUpperCase()}
                    </button>
                )}

                <button
                    onClick={handleReset}
                    className="p-3 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
                    title={t('ui.reset')}
                >
                    <RotateCcw className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                    className={`p-3 rounded-full transition-all ${isMusicEnabled ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}
                    title={isMusicEnabled ? t('ui.soundOff') : t('ui.soundOn')}
                >
                    {isMusicEnabled ? (
                        <Volume2 className="w-5 h-5" />
                    ) : (
                        <VolumeX className="w-5 h-5" />
                    )}
                </button>

                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-3 rounded-full transition-all ${showSettings ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}
                    title={t('ui.settings')}
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Settings panel - Minimalist */}
            {showSettings && (
                <div className="w-full max-w-md mt-12 pt-8 border-t border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500">{t('ui.inhaleDuration')}</label>
                                <span className="text-sm font-mono">{settings.inhale}s</span>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="10"
                                step="0.5"
                                value={settings.inhale}
                                onChange={(e) => setSettings(s => ({ ...s, inhale: Number(e.target.value) }))}
                                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
                                disabled={isRunning || mode !== 'custom'}
                            />
                        </div>

                        {/* Hold In slider - only visible when holdIn > 0 or in custom mode */}
                        {(mode === 'custom' || settings.holdIn > 0) && (
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs uppercase tracking-widest text-gray-500">{t('ui.holdInDuration')}</label>
                                    <span className="text-sm font-mono">{settings.holdIn}s</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={settings.holdIn}
                                    onChange={(e) => setSettings(s => ({ ...s, holdIn: Number(e.target.value) }))}
                                    className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
                                    disabled={isRunning || mode !== 'custom'}
                                />
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500">{t('ui.exhaleDuration')}</label>
                                <span className="text-sm font-mono">{settings.exhale}s</span>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="10"
                                step="0.5"
                                value={settings.exhale}
                                onChange={(e) => setSettings(s => ({ ...s, exhale: Number(e.target.value) }))}
                                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
                                disabled={isRunning || mode !== 'custom'}
                            />
                        </div>

                        {/* Hold Out slider - only visible when holdOut > 0 or in custom mode */}
                        {(mode === 'custom' || settings.holdOut > 0) && (
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs uppercase tracking-widest text-gray-500">{t('ui.holdOutDuration')}</label>
                                    <span className="text-sm font-mono">{settings.holdOut}s</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={settings.holdOut}
                                    onChange={(e) => setSettings(s => ({ ...s, holdOut: Number(e.target.value) }))}
                                    className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
                                    disabled={isRunning || mode !== 'custom'}
                                />
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs uppercase tracking-widest text-gray-500">{t('ui.sessionDuration')}</label>
                                <span className="text-sm font-mono">{settings.sessionDuration} min</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={settings.sessionDuration}
                                onChange={(e) => setSettings(s => ({ ...s, sessionDuration: Number(e.target.value) }))}
                                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
                                disabled={isRunning}
                            />
                        </div>

                        {/* Breathing rate info */}
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-400">
                                {t('ui.breathingRate', { rate: breathingRate })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
