'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, CollapseIcon, FullScreenIcon, Settings02Icon, Share08Icon, Volume02Icon, VolumeMute02Icon, WaveIcon, WavesIcon, WindIcon } from '@hugeicons/core-free-icons';
import { startFlyover, type Flyover } from '@/components/flyover/engine';
import { createFocusSound, type FocusSound, type SoundLayer } from '@/components/flyover/focus-sound';
import { CARD_SCENE_HEIGHT, CARD_SCENE_SCALE, CARD_WIDTH, renderFlyoverCard } from '@/components/flyover/share-card';
import { ProgressShareModal } from '@/components/ui/ProgressShareModal';
import styles from './WhiteNoiseFlyover.module.css';

const LAYERS: SoundLayer[] = ['wind', 'stream', 'deep'];
const DEFAULT_LEVELS: Record<SoundLayer, number> = { wind: 0.5, stream: 0.6, deep: 0.35 };
const TIMER_OPTIONS = [0, 15, 30, 60] as const;
type TimerMinutes = (typeof TIMER_OPTIONS)[number];
const KEY_TURN = Math.PI / 12;
const LAYER_ICONS = { wind: WindIcon, stream: WavesIcon, deep: WaveIcon };

function formatRemaining(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

const controlButton =
    'inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

export default function WhiteNoiseFlyover() {
    const t = useTranslations('games.whiteNoise.controls');
    const pageT = useTranslations('games.whiteNoise');
    const shellRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const flyoverRef = useRef<Flyover | null>(null);
    const soundRef = useRef<FocusSound | null>(null);
    const soundStartingRef = useRef(false);
    const [failed, setFailed] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [levels, setLevels] = useState(DEFAULT_LEVELS);
    const [timerMinutes, setTimerMinutes] = useState<TimerMinutes>(0);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const timerEndAtRef = useRef<number | null>(null);
    const mediaTitleRef = useRef(pageT('heading'));
    mediaTitleRef.current = pageT('heading');

    useEffect(() => {
        if (!stageRef.current || !canvasRef.current) return;
        const flyover = startFlyover(canvasRef.current, stageRef.current, { feather: true, mode: 'steer' });
        if (!flyover) {
            setFailed(true);
            return;
        }
        flyoverRef.current = flyover;
        flyover.setWind(DEFAULT_LEVELS.wind);
        const sound = createFocusSound(DEFAULT_LEVELS, {
            metadata: {
                title: mediaTitleRef.current,
                artist: 'Free Focus Games',
                artwork: '/games/white-noise-cover.png',
            },
            onPlayingChange: (nextPlaying) => {
                setPlaying(nextPlaying);
            },
        });
        soundRef.current = sound;

        // The brook gets louder near the river and sits on the side the river is on.
        // Skip polling while hidden so background playback keeps a steady stereo image.
        const timer = window.setInterval(() => {
            if (!sound.playing || document.hidden) return;
            const { riverOffsetRight, riverDistance } = flyover.state();
            sound.setRiver(Math.max(0, 1 - riverDistance / 0.3), riverOffsetRight / 0.3);
        }, 250);

        const onFullscreen = () => {
            const active = document.fullscreenElement === shellRef.current;
            setFullscreen(active);
            flyover.setFeather(!active);
        };
        document.addEventListener('fullscreenchange', onFullscreen);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('fullscreenchange', onFullscreen);
            flyover.destroy();
            sound.dispose();
            flyoverRef.current = null;
            soundRef.current = null;
        };
    }, []);

    // Track optional focus timer by wall-clock deadline so it stays accurate across screen lock.
    useEffect(() => {
        if (!playing || timerMinutes === 0) {
            timerEndAtRef.current = null;
            setRemainingSeconds(null);
            return;
        }
        if (!timerEndAtRef.current) {
            timerEndAtRef.current = Date.now() + timerMinutes * 60 * 1000;
            setRemainingSeconds(timerMinutes * 60);
        }
        const checkTimer = () => {
            if (!timerEndAtRef.current) return;
            const left = Math.max(0, Math.ceil((timerEndAtRef.current - Date.now()) / 1000));
            setRemainingSeconds(left);
            if (left <= 0) {
                timerEndAtRef.current = null;
                soundRef.current?.stop();
                setPlaying(false);
            }
        };
        const interval = window.setInterval(checkTimer, 1000);
        document.addEventListener('visibilitychange', checkTimer);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', checkTimer);
        };
    }, [playing, timerMinutes]);

    // Close the settings panel on an outside click or Escape.
    useEffect(() => {
        if (!panelOpen) return;
        const onDown = (e: PointerEvent) => {
            if (!panelRef.current?.contains(e.target as Node)) setPanelOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPanelOpen(false);
                settingsButtonRef.current?.focus({ preventScroll: true });
            }
        };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [panelOpen]);

    const aimAt = useCallback((clientX: number, clientY: number) => {
        const stage = stageRef.current;
        if (!stage) return;
        const r = stage.getBoundingClientRect();
        flyoverRef.current?.aimAt((clientX - r.left) / r.width, (clientY - r.top) / r.height);
    }, []);

    const startSound = async () => {
        const sound = soundRef.current;
        if (!sound || sound.playing || soundStartingRef.current) return;
        // Dragging emits many changes while the audio context is still resuming.
        soundStartingRef.current = true;
        try {
            await sound.start();
            if (soundRef.current === sound) setPlaying(sound.playing);
        } catch (error) {
            console.error('Unable to start focus sound', error);
        } finally {
            soundStartingRef.current = false;
        }
    };

    const toggleSound = async () => {
        const sound = soundRef.current;
        if (!sound) return;
        if (sound.playing) {
            sound.stop();
            setPlaying(false);
        } else {
            await startSound();
        }
    };

    const setLevel = (layer: SoundLayer, value: number) => {
        setLevels((prev) => ({ ...prev, [layer]: value }));
        soundRef.current?.setLevel(layer, value);
        if (layer === 'wind') flyoverRef.current?.setWind(value);
        void startSound();
    };

    const selectTimer = (minutes: TimerMinutes) => {
        setTimerMinutes(minutes);
        if (minutes === 0) {
            timerEndAtRef.current = null;
            setRemainingSeconds(null);
            return;
        }
        timerEndAtRef.current = Date.now() + minutes * 60 * 1000;
        setRemainingSeconds(minutes * 60);
        void startSound();
    };

    // Read the latest text and mix through a ref so the card is drawn once per opening,
    // not again on every re-render while the dialog is open.
    const cardTextRef = useRef({ title: '', subtitle: '', mixLabel: '', mix: '' });
    cardTextRef.current = {
        title: pageT('heading'),
        subtitle: pageT('share.cardLine'),
        mixLabel: pageT('share.mixLabel'),
        mix: LAYERS.map((id) => `${t(id)} ${Math.round(levels[id] * 100)}%`).join('  ·  '),
    };
    const renderShareCard = useCallback(async () => {
        const scene = flyoverRef.current?.snapshot(CARD_WIDTH, CARD_SCENE_HEIGHT, CARD_SCENE_SCALE);
        if (!scene) throw new Error('Scene unavailable');
        return renderFlyoverCard(scene, {
            ...cardTextRef.current,
            url: `${window.location.host.replace(/^www\./, '')}${window.location.pathname}`,
        });
    }, []);

    const openShare = () => {
        setPanelOpen(false);
        if (document.fullscreenElement) void document.exitFullscreen();
        setShareOpen(true);
    };

    const toggleFullscreen = () => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void shellRef.current?.requestFullscreen?.();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const delta = e.key === 'ArrowLeft' ? -KEY_TURN : e.key === 'ArrowRight' ? KEY_TURN : 0;
        if (!delta) return;
        e.preventDefault();
        flyoverRef.current?.turn(delta);
    };

    if (failed) {
        return <p className="p-8 text-center text-muted-foreground">{t('unsupported')}</p>;
    }

    return (
        <div
            ref={shellRef}
            className={fullscreen ? 'relative flex h-screen w-screen flex-col bg-background' : 'relative flex w-full flex-col'}
        >
            <div className={fullscreen ? 'relative min-h-0 flex-1' : 'relative aspect-[3/4] w-full sm:aspect-[16/10]'}>
                <div
                    ref={stageRef}
                    tabIndex={0}
                    role="application"
                    aria-label={t('stageLabel')}
                    onKeyDown={onKeyDown}
                    onPointerMove={(e) => {
                        if (e.pointerType === 'mouse' || e.buttons) aimAt(e.clientX, e.clientY);
                    }}
                    onPointerDown={(e) => aimAt(e.clientX, e.clientY)}
                    className="absolute inset-0 touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900/40"
                >
                    <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
                </div>
            </div>

            <div
                ref={panelRef}
                className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6"
            >
                <div className="flex items-center gap-0.5">
                    {playing && remainingSeconds !== null && (
                        <span
                            aria-live="off"
                            className="mr-1 rounded-md bg-black/25 px-2 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-xs"
                        >
                            {formatRemaining(remainingSeconds)}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={toggleSound}
                        aria-pressed={playing}
                        aria-label={playing ? t('pause') : t('play')}
                        title={playing ? t('pause') : t('play')}
                        className={controlButton}
                    >
                        <HugeiconsIcon icon={playing ? Volume02Icon : VolumeMute02Icon} size={24} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label={fullscreen ? t('exitFullscreen') : t('fullscreen')}
                        title={fullscreen ? t('exitFullscreen') : t('fullscreen')}
                        className={controlButton}
                    >
                        <HugeiconsIcon icon={fullscreen ? CollapseIcon : FullScreenIcon} size={24} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={openShare}
                        aria-label={pageT('share.button')}
                        title={pageT('share.button')}
                        className={controlButton}
                    >
                        <HugeiconsIcon icon={Share08Icon} size={24} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                        ref={settingsButtonRef}
                        type="button"
                        onClick={() => setPanelOpen((open) => !open)}
                        aria-expanded={panelOpen}
                        aria-controls="white-noise-mix"
                        aria-label={t('settings')}
                        title={t('settings')}
                        className={controlButton}
                    >
                        <HugeiconsIcon icon={Settings02Icon} size={24} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                </div>
                {panelOpen && (
                    <div
                        id="white-noise-mix"
                        role="group"
                        aria-labelledby="white-noise-mix-title"
                        className={`${styles.panel} absolute right-0 top-full mt-3 max-h-[60vh] overflow-y-auto rounded-2xl border px-5 pb-4 pt-3`}
                    >
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h2 id="white-noise-mix-title" className="m-0 text-xs font-normal leading-4 text-[#66735c]">{t('mixTitle')}</h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setPanelOpen(false);
                                    settingsButtonRef.current?.focus({ preventScroll: true });
                                }}
                                aria-label={pageT('share.close')}
                                title={pageT('share.close')}
                                className="-mr-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#66735c] hover:bg-black/5 hover:text-[#34412d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#627456]"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.5} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {LAYERS.map((id) => {
                                const pct = Math.round(levels[id] * 100);
                                return (
                                    <label key={id} className="block">
                                        <span className="flex items-center gap-2.5 text-sm">
                                            <HugeiconsIcon icon={LAYER_ICONS[id]} size={18} strokeWidth={1.5} className="text-[#66735c]" aria-hidden="true" />
                                            <span className="flex-1">{t(id)}</span>
                                            <span className="text-xs tabular-nums text-[#66735c]">{pct}%</span>
                                        </span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            value={levels[id]}
                                            aria-valuetext={`${pct}%`}
                                            onChange={(e) => setLevel(id, Number(e.target.value))}
                                            style={{ '--level': `${pct}%` } as CSSProperties}
                                            className={styles.slider}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        <div className="mt-4 border-t border-black/10 pt-3">
                            <p className="mb-2 text-xs font-normal leading-4 text-[#66735c]">{t('timerTitle')}</p>
                            <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={t('timerTitle')}>
                                {TIMER_OPTIONS.map((minutes) => {
                                    const active = timerMinutes === minutes;
                                    return (
                                        <button
                                            key={minutes}
                                            type="button"
                                            onClick={() => selectTimer(minutes)}
                                            aria-pressed={active}
                                            className={`cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#627456] ${
                                                active
                                                    ? 'bg-[#34412d] text-white'
                                                    : 'bg-black/5 text-[#34412d] hover:bg-black/10'
                                            }`}
                                        >
                                            {minutes === 0 ? t('timerLoop') : t('timerMinutes', { minutes })}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <p className="mt-3 text-[11px] leading-4 text-[#66735c]">{t('backgroundHint')}</p>
                    </div>
                )}
            </div>

            <p className="pointer-events-none px-3 py-2 text-center text-xs leading-relaxed text-[#56634e] sm:text-sm">
                {t('hint')}
            </p>

            <ProgressShareModal
                isOpen={shareOpen}
                onClose={() => setShareOpen(false)}
                card={null}
                fileName="white-noise-for-focus.png"
                renderImage={renderShareCard}
                shareText={pageT('share.text')}
                messages="games.whiteNoise.share"
            />
        </div>
    );
}
