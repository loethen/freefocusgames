'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useFishEngine, GamePhase } from '../hooks/useFishEngine';
import { SunfishSVG } from './SunfishSVG';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GameSettings {
    fishCount: number;
    targetCount: number;
    speed: number;
}

const DEFAULT_SETTINGS: GameSettings = {
    fishCount: 6,
    targetCount: 2,
    speed: 1.0,
};

export default function GameComponent() {
    const t = useTranslations('games.fishTrace');
    const containerRef = useRef<HTMLDivElement>(null);

    // Settings
    const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('fishTraceSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const saveSettings = (newSettings: GameSettings) => {
        setSettings(newSettings);
        localStorage.setItem('fishTraceSettings', JSON.stringify(newSettings));
        setIsSettingsOpen(false);
    };

    // High Level Game State
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [score, setScore] = useState(0);

    // UI Messages
    const [message, setMessage] = useState('');

    const {
        fishesRef,
        initFishes,
        startMovement,
        stopMovement,
        toggleSelection,
        markResults,
        renderTrigger
    } = useFishEngine({
        containerWidth: containerRef.current?.clientWidth || 800,
        containerHeight: containerRef.current?.clientHeight || 600,
        fishCount: settings.fishCount,
        targetCount: settings.targetCount,
        speedMultiplier: settings.speed
    });

    // Refs for animating physics DOM elements outside React's render cycle
    const fishNodeRefs = useRef<{ [id: number]: HTMLDivElement | null }>({});

    // The Sync Loop: copy ref coordinates to DOM nodes at 60fps and calculate rotation
    useEffect(() => {
        let frameId: number;
        const renderLoop = () => {
            if (phase === 'watching' || phase === 'tracking') {
                const fishes = fishesRef.current;
                Object.values(fishes).forEach(fish => {
                    const node = fishNodeRefs.current[fish.id];
                    if (node) {
                        const flipX = fish.vx < 0 ? -1 : 1;
                        node.style.transform = `translate(${fish.x - 30}px, ${fish.y - 30}px) scaleX(${flipX})`;
                    }
                });
            }
            frameId = requestAnimationFrame(renderLoop);
        };

        if (phase === 'watching' || phase === 'tracking') {
            frameId = requestAnimationFrame(renderLoop);
        }
        return () => cancelAnimationFrame(frameId);
    }, [phase, fishesRef]);

    const startGame = () => {
        setPhase('watching');
        setMessage(t('start') || "记住发光的鱼！");

        // Wait for next tick so containerRef is sized before init (if it was hidden)
        setTimeout(() => {
            initFishes();
            startMovement();

            const glowDur = 3000;

            setTimeout(() => {
                setMessage(t('glowEnding') || "光芒即将消失...");
            }, glowDur - 1000);

            // Step 2: Tracking phase
            setTimeout(() => {
                setPhase('tracking');
                setMessage(t('tracking') || "仔细追踪它们！");

                // Step 3: Selection phase
                const trackDur = 5000;
                setTimeout(() => {
                    stopMovement();
                    setPhase('selecting');
                    setMessage(t('selection') || "点击选出刚才发光的鱼！");
                }, trackDur);

            }, glowDur);

        }, 100);
    };

    const handleFishClick = (id: number) => {
        if (phase !== 'selecting') return;
        toggleSelection(id);
    };

    const confirmSelection = () => {
        setPhase('completed');
        markResults();

        // Check win/loss
        const fishes = Object.values(fishesRef.current);
        const correctSelections = fishes.filter(f => f.isTarget && f.isSelected).length;
        const wrongSelections = fishes.filter(f => !f.isTarget && f.isSelected).length;
        const missedTargets = fishes.filter(f => f.isTarget && !f.isSelected).length;

        if (wrongSelections === 0 && missedTargets === 0) {
            setMessage(t('success') || "成功选出所有发光小鱼！");
            setScore(s => s + 100);
        } else {
            setMessage(t('fail') || `游戏结束！得分：${score}`);
            setScore(0);
        }
    };

    // Render Fish Nodes
    const fishes = Object.values(fishesRef.current);

    return (
        <div className="w-full h-full relative overflow-hidden bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 bg-[url('/games/assets/sea/sea_bg.png')] bg-cover bg-center" ref={containerRef}>

            {/* Settings Button - Top Right */}
            {phase === 'idle' && (
                <div className="absolute top-4 right-4 z-40">
                    <GameSettingsDialog
                        settings={settings}
                        onSave={saveSettings}
                        isOpen={isSettingsOpen}
                        onOpenChange={setIsSettingsOpen}
                    />
                </div>
            )}

            {/* Play Area */}
            <div className="absolute inset-0 z-10 w-full h-full overflow-hidden">
                {phase !== 'idle' && fishes.map(fish => {
                    // When tracking, hiding the glowing effect
                    const isGlowing = phase === 'watching' && fish.isTarget;

                    const flipX = fish.vx < 0 ? -1 : 1;

                    return (
                        <div
                            key={fish.id}
                            ref={el => { fishNodeRefs.current[fish.id] = el; }}
                            onClick={() => handleFishClick(fish.id)}
                            className="absolute top-0 left-0 cursor-pointer"
                            style={{
                                transform: phase === 'selecting' || phase === 'completed'
                                    ? `translate(${fish.x - 30}px, ${fish.y - 30}px) scaleX(${flipX})`
                                    : undefined,
                                transition: phase === 'selecting' || phase === 'completed' ? 'transform 0.5s ease' : 'none',
                                willChange: 'transform'
                            }}
                        >
                            <SunfishSVG
                                isGlowing={isGlowing}
                                isSelected={fish.isSelected}
                                isTarget={fish.isTarget}
                                isChecking={fish.isChecking}
                                isWrongSelection={fish.isWrongSelection}
                            />
                        </div>
                    );
                })}
            </div>

            {/* UI Overlay */}
            <AnimatePresence>
                {/* Header HUD */}
                {phase !== 'idle' && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute top-6 left-0 right-0 z-20 flex justify-between px-8 pointer-events-none font-mono"
                    >
                        <div className="bg-background text-foreground px-6 py-2 rounded-full shadow-sm border font-bold text-lg tracking-wide uppercase">
                            {message}
                        </div>
                        <div className="bg-background text-foreground px-5 py-2 rounded-full shadow-sm border uppercase text-sm tracking-widest font-bold">
                            {t('scorePrefix') || 'Score:'} {score}
                        </div>
                    </motion.div>
                )}

                {/* Idle Menu */}
                {phase === 'idle' && (
                    <motion.div
                        key="idle-menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm"
                    >
                        <h1 className="text-6xl font-black text-black dark:text-white mb-12 uppercase tracking-tight drop-shadow-md">
                            {t('title') || '发光小鱼'}
                        </h1>
                        <Button
                            size="lg"
                            onClick={() => startGame()}
                            className="w-48 h-14 text-2xl font-bold uppercase tracking-widest font-mono rounded-xl"
                        >
                            {t('startBtn') || 'START'}
                        </Button>
                    </motion.div>
                )}

                {/* Selection Confirm Button */}
                {phase === 'selecting' && (
                    <motion.div
                        key="confirm-btn"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute bottom-10 left-0 right-0 z-30 flex justify-center"
                    >
                        <Button
                            size="lg"
                            onClick={confirmSelection}
                            className="font-bold py-6 px-12 text-lg uppercase tracking-widest font-mono rounded-xl"
                        >
                            {t('confirmSelection') || '确定选择'}
                        </Button>
                    </motion.div>
                )}

                {/* Completed Result Menu */}
                {phase === 'completed' && (
                    <motion.div
                        key="result-menu"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-12 left-0 right-0 z-30 flex justify-center space-x-6"
                    >
                        <Button
                            size="lg"
                            onClick={() => startGame()}
                            className="font-bold py-6 px-12 text-lg uppercase tracking-widest font-mono rounded-xl hover:scale-105 transition-transform"
                        >
                            {t('tryAgain') || '再试一次'}
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={() => setPhase('idle')}
                            className="font-bold py-6 px-8 text-lg uppercase tracking-widest font-mono rounded-xl shadow-md border"
                        >
                            {t('home') || '返回主页'}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function GameSettingsDialog({
    settings,
    onSave,
    isOpen,
    onOpenChange
}: {
    settings: GameSettings;
    onSave: (settings: GameSettings) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
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
                <Button variant="outline" size="icon" className="w-12 h-12 shadow-sm rounded-full">
                    <Settings className="w-6 h-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md font-mono rounded-xl">
                <DialogHeader>
                    <DialogTitle className="uppercase font-bold tracking-widest">Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="fishCount" className="uppercase font-bold tracking-wider">Total Fishes</Label>
                        <Input
                            id="fishCount"
                            type="number"
                            min="3"
                            max="50"
                            value={tempSettings.fishCount}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setTempSettings({
                                    ...tempSettings,
                                    fishCount: Math.min(50, Math.max(3, val))
                                });
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="targetCount" className="uppercase font-bold tracking-wider">Target Fishes</Label>
                        <Input
                            id="targetCount"
                            type="number"
                            min="1"
                            max={Math.max(1, tempSettings.fishCount - 1)}
                            value={tempSettings.targetCount}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setTempSettings({
                                    ...tempSettings,
                                    targetCount: Math.min(Math.max(1, tempSettings.fishCount - 1), Math.max(1, val))
                                });
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="speed" className="uppercase font-bold tracking-wider">Speed Multiplier</Label>
                        <Input
                            id="speed"
                            type="number"
                            min="0.5"
                            max="5.0"
                            step="0.5"
                            value={tempSettings.speed}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                setTempSettings({
                                    ...tempSettings,
                                    speed: Math.min(5.0, Math.max(0.5, val))
                                });
                            }}
                        />
                    </div>
                </div>
                <div className="flex justify-between gap-2 mt-4">
                    <Button variant="outline" onClick={handleResetToDefault} className="uppercase font-bold text-sm tracking-wider">
                        Reset
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="uppercase font-bold text-sm tracking-wider">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="uppercase font-bold text-sm tracking-wider">
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}