'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Maximize2, Minimize2, Pause, Play, Share2, SlidersHorizontal } from 'lucide-react';
import { startFlyover, type Flyover } from '@/components/flyover/engine';
import { createFocusSound, type FocusSound, type SoundLayer } from '@/components/flyover/focus-sound';
import { CARD_SCENE_HEIGHT, CARD_SCENE_SCALE, CARD_WIDTH, renderFlyoverCard } from '@/components/flyover/share-card';
import { ProgressShareModal } from '@/components/ui/ProgressShareModal';

const LAYERS: SoundLayer[] = ['wind', 'stream', 'deep'];
const DEFAULT_LEVELS: Record<SoundLayer, number> = { wind: 0.5, stream: 0.6, deep: 0.35 };
const KEY_TURN = Math.PI / 12;

const glassButton =
    'inline-flex h-10 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900';

export default function WhiteNoiseFlyover() {
    const t = useTranslations('games.whiteNoise.controls');
    const pageT = useTranslations('games.whiteNoise');
    const shellRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const flyoverRef = useRef<Flyover | null>(null);
    const soundRef = useRef<FocusSound | null>(null);
    const [failed, setFailed] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [levels, setLevels] = useState(DEFAULT_LEVELS);
    const [fullscreen, setFullscreen] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [steered, setSteered] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    useEffect(() => {
        if (!stageRef.current || !canvasRef.current) return;
        const flyover = startFlyover(canvasRef.current, stageRef.current, { feather: true, mode: 'steer' });
        if (!flyover) {
            setFailed(true);
            return;
        }
        flyoverRef.current = flyover;
        const sound = createFocusSound(DEFAULT_LEVELS);
        soundRef.current = sound;

        // The brook gets louder near the river and sits on the side the river is on.
        const timer = window.setInterval(() => {
            if (!sound.playing) return;
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

    // Close the settings panel on an outside click or Escape.
    useEffect(() => {
        if (!panelOpen) return;
        const onDown = (e: PointerEvent) => {
            if (!panelRef.current?.contains(e.target as Node)) setPanelOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPanelOpen(false);
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
        setSteered(true);
    }, []);

    const toggleSound = async () => {
        const sound = soundRef.current;
        if (!sound) return;
        if (sound.playing) {
            sound.stop();
            setPlaying(false);
        } else {
            await sound.start();
            setPlaying(true);
        }
    };

    const setLevel = (layer: SoundLayer, value: number) => {
        setLevels((prev) => ({ ...prev, [layer]: value }));
        soundRef.current?.setLevel(layer, value);
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
        setSteered(true);
    };

    if (failed) {
        return <p className="p-8 text-center text-muted-foreground">{t('unsupported')}</p>;
    }

    return (
        <div
            ref={shellRef}
            className={fullscreen ? 'relative h-screen w-screen bg-background' : 'relative aspect-[3/4] w-full sm:aspect-[16/10]'}
        >
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

            <p
                className={`pointer-events-none absolute bottom-[8%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/30 px-4 py-1.5 text-sm text-white backdrop-blur-sm transition-opacity duration-700 ${steered ? 'opacity-0' : 'opacity-100'}`}
            >
                {t('hint')}
            </p>

            <div
                ref={panelRef}
                className={`absolute flex items-start gap-2 ${fullscreen ? 'right-5 top-5' : 'right-[6%] top-[7%]'}`}
            >
                <button
                    type="button"
                    onClick={toggleSound}
                    aria-pressed={playing}
                    aria-label={playing ? t('pause') : t('play')}
                    className={`${glassButton} gap-2 ${playing ? 'w-10' : 'px-4 text-sm font-semibold'}`}
                >
                    {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                    {!playing && t('play')}
                </button>
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label={fullscreen ? t('exitFullscreen') : t('fullscreen')}
                    title={fullscreen ? t('exitFullscreen') : t('fullscreen')}
                    className={`${glassButton} w-10`}
                >
                    {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
                </button>
                <button
                    type="button"
                    onClick={openShare}
                    aria-label={pageT('share.button')}
                    title={pageT('share.button')}
                    className={`${glassButton} w-10`}
                >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setPanelOpen((open) => !open)}
                        aria-expanded={panelOpen}
                        aria-controls="white-noise-mix"
                        aria-label={t('settings')}
                        title={t('settings')}
                        className={`${glassButton} w-10 ${panelOpen ? 'bg-white text-slate-900' : ''}`}
                    >
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {panelOpen && (
                        <div
                            id="white-noise-mix"
                            role="group"
                            aria-label={t('mixTitle')}
                            className="absolute right-0 top-12 z-10 w-52 space-y-3.5 rounded-2xl bg-white px-4 py-3.5 text-slate-800 shadow-lg ring-1 ring-black/5"
                        >
                            {LAYERS.map((id) => {
                                const pct = Math.round(levels[id] * 100);
                                return (
                                    <label key={id} className="block">
                                        <span className="mb-2 flex items-center justify-between text-[13px]">
                                            {t(id)}
                                            <span className="tabular-nums text-slate-400">{pct}</span>
                                        </span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            value={levels[id]}
                                            onChange={(e) => setLevel(id, Number(e.target.value))}
                                            style={{ background: `linear-gradient(to right, #1e293b ${pct}%, #e2e8f0 ${pct}%)` }}
                                            className="block h-[3px] w-full cursor-pointer appearance-none rounded-full focus-visible:outline-none [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-slate-800 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-800 focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-slate-400"
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

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
