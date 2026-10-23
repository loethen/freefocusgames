'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export type BreathingPhase = 'idle' | 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

interface LotusFlowerProps {
    phase: BreathingPhase;
    duration: number;
    compact?: boolean;
}

export default function LotusFlower({ phase, duration, compact = false }: LotusFlowerProps) {
    const isInhale = phase === 'inhale';
    const isExhale = phase === 'exhale';
    const isHoldIn = phase === 'holdIn';
    const isHoldOut = phase === 'holdOut';
    const isActive = phase !== 'idle';
    const t = useTranslations('games.resonanceBreathing.ui');

    // 7 petals configuration
    const petals = [
        // Outer
        { id: 'left-3', openAngle: -60, color: '#A5E3D9', opacity: 0.7, scale: 0.85 },
        { id: 'right-3', openAngle: 60, color: '#A5E3D9', opacity: 0.7, scale: 0.85 },
        // Middle
        { id: 'left-2', openAngle: -40, color: '#7DD4C6', opacity: 0.8, scale: 0.9 },
        { id: 'right-2', openAngle: 40, color: '#7DD4C6', opacity: 0.8, scale: 0.9 },
        // Inner
        { id: 'left-1', openAngle: -20, color: '#5DC8B8', opacity: 0.85, scale: 0.95 },
        { id: 'right-1', openAngle: 20, color: '#5DC8B8', opacity: 0.85, scale: 0.95 },
        // Center
        { id: 'center', openAngle: 0, color: '#4ABDAC', opacity: 0.9, scale: 1 },
    ];

    // Petal dimensions
    const petalWidth = 80;
    const petalHeight = 220;

    // Determine petal rotation based on phase
    const getTargetRotation = (petal: typeof petals[0]) => {
        if (isInhale) return petal.openAngle;       // Opening
        if (isHoldIn) return petal.openAngle;        // Stay open
        if (isExhale) return 0;                       // Closing
        if (isHoldOut) return 0;                      // Stay closed
        return 0;                                     // idle
    };

    // Determine animation properties based on phase
    const getTransition = (petal: typeof petals[0]) => {
        if (isHoldIn || isHoldOut) {
            // During hold: no movement animation, just a subtle pulse
            return {
                duration: 0.3,
                ease: 'easeOut',
            };
        }
        return {
            duration: duration,
            ease: isInhale ? 'easeOut' : 'easeIn',
            delay: isInhale ? Math.abs(petal.openAngle) * 0.002 : 0,
        };
    };

    // Phase display text
    const getPhaseText = () => {
        if (isInhale) return t('inhale');
        if (isHoldIn || isHoldOut) return t('hold');
        if (isExhale) return t('exhale');
        return t('ready');
    };

    return (
        <div className={`relative flex items-end justify-center ${compact ? 'w-52 h-44' : 'w-80 h-72 md:w-96 md:h-[22rem]'}`}>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 400 350"
                className="overflow-visible"
            >
                {/* Horizon line - Minimalist Gray */}
                <line
                    x1="0"
                    y1="330"
                    x2="400"
                    y2="330"
                    stroke="#E5E7EB" // gray-200
                    strokeWidth="1"
                />

                {/* Petals container - translated to Horizon Point (200, 330) */}
                <g transform="translate(200, 330)">
                    {petals.map((petal) => (
                        <motion.g
                            key={petal.id}
                            animate={{
                                rotate: getTargetRotation(petal),
                                scaleX: petal.scale,
                                scaleY: (isHoldIn || isHoldOut)
                                    ? petal.scale  // subtle pulse handled by opacity
                                    : petal.scale,
                            }}
                            transition={getTransition(petal)}
                        >
                            <g>
                                {/* Visible Petal - Cubic Bezier for rounder shape */}
                                <motion.path
                                    d={`M0 0 
                     C-${petalWidth} -${petalHeight * 0.4}, -${petalWidth} -${petalHeight * 0.8}, 0 -${petalHeight}
                     C${petalWidth} -${petalHeight * 0.8}, ${petalWidth} -${petalHeight * 0.4}, 0 0`}
                                    fill={petal.color}
                                    initial={{ opacity: petal.opacity }}
                                    style={{ opacity: petal.opacity }}
                                    animate={{
                                        opacity: (isHoldIn || isHoldOut)
                                            ? [petal.opacity, petal.opacity * 0.85, petal.opacity]
                                            : petal.opacity,
                                    }}
                                    transition={
                                        (isHoldIn || isHoldOut)
                                            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                                            : { duration: 0.3 }
                                    }
                                />

                                {/* Inner detail line */}
                                <path
                                    d={`M0 0 L0 -${petalHeight * 0.7}`}
                                    stroke="white"
                                    strokeWidth="1.5"
                                    opacity="0.3"
                                    fill="none"
                                />

                                {/* INVISIBLE COUNTER-BALANCE */}
                                <rect
                                    x={-petalWidth}
                                    y={0}
                                    width={petalWidth * 2}
                                    height={petalHeight}
                                    fill="none"
                                    opacity="0"
                                />
                            </g>
                        </motion.g>
                    ))}
                </g>
            </svg>

            {/* Phase text - Minimalist Black/Gray */}
            <motion.div
                className={`absolute left-1/2 -translate-x-1/2 text-sm font-medium tracking-[0.2em] uppercase ${compact ? '-bottom-7' : '-bottom-10'}`}
                animate={{ opacity: isActive ? 1 : 0.4 }}
            >
                <span className="text-black">
                    {getPhaseText()}
                </span>
            </motion.div>
        </div>
    );
}
