import React, { memo } from 'react';

interface SunfishSVGProps {
    isGlowing: boolean;
    isSelected: boolean;
    isTarget: boolean;
    isChecking: boolean;
    isWrongSelection: boolean;
    size?: number;
    rotation?: number;
    flipY?: boolean;
}

// A memoized simple cute fish SVG. (Side view, swims forward)
export const SunfishSVG = memo(({
    isGlowing,
    isSelected,
    isTarget,
    isChecking,
    isWrongSelection,
    size = 60,
    rotation = 0,
    flipY = false
}: SunfishSVGProps) => {

    // Determine the base color and effects based on status
    let bodyColor = '#FFB703'; // Warm golden yellow
    let finColor = '#219EBC';  // Cerulean blue
    let stripeColor = '#FB8500'; // Orange stripes
    let strokeColor = '#023047'; // Deep navy blue outline
    let filter = '';
    let strokeWidth = "2.5";

    if (isGlowing && !isChecking) {
        // Initially glowing to memorize - bright Neon Cyan
        strokeColor = '#00E5FF';
        strokeWidth = "5";
        filter = 'drop-shadow(0 0 8px #00E5FF) drop-shadow(0 0 16px #00E5FF)';
    } else if (isChecking) {
        if (isTarget && isSelected) {
            // Correctly selected! Bright Neon Green glow
            strokeColor = '#00E88F';
            strokeWidth = "5";
            filter = 'drop-shadow(0 0 8px #00E88F) drop-shadow(0 0 16px #00E88F)';
        } else if (isTarget && !isSelected) {
            // Missed! Grey out sadly
            bodyColor = '#D4D4D8';
            finColor = '#A1A1AA';
            stripeColor = '#A1A1AA';
            strokeColor = '#71717A';
            strokeWidth = "2.5";
            filter = 'opacity(0.6) grayscale(80%)';
        } else if (!isTarget && isWrongSelection) {
            // Wrong selection! Error Red tint
            strokeColor = '#FF0054';
            strokeWidth = "5";
            filter = 'drop-shadow(0 0 8px #FF0054)';
        } else {
            // Unselected neutral
            filter = 'brightness(0.9) grayscale(20%)';
        }
    } else if (isSelected) {
        // Actively selected by user (before checking phase) - Neon Cyan outline
        strokeColor = '#00E5FF';
        strokeWidth = "5";
        filter = 'drop-shadow(0 0 8px #00E5FF)';
    }

    return (
        <div
            style={{
                width: size,
                height: size,
                filter,
                transition: 'filter 0.3s ease',
            }}
            className="relative flex items-center justify-center will-change-transform"
        >
            {/* Simple smooth CSS swimming animation for the tail */}
            <style jsx>{`
                @keyframes swim-tail {
                    0%, 100% { transform: scaleX(1); }
                    50% { transform: scaleX(0.4); }
                }
                @keyframes swim-fin-top {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(8deg); }
                }
                @keyframes swim-fin-bottom {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(-8deg); }
                }
                @keyframes swim-body {
                    0%, 100% { transform: scaleY(1) scaleX(1); }
                    50% { transform: scaleY(0.96) scaleX(0.98); }
                }
                .tail { transform-origin: 25px 50px; animation: swim-tail 0.8s infinite ease-in-out; }
                .fin-top { transform-origin: 52px 30px; animation: swim-fin-top 0.8s infinite ease-in-out; }
                .fin-bottom { transform-origin: 55px 70px; animation: swim-fin-bottom 0.8s infinite ease-in-out; }
                .fish-body { transform-origin: 55px 50px; animation: swim-body 0.8s infinite ease-in-out; }
            `}</style>

            <svg viewBox="0 0 100 100" className="w-full h-full block transition-all duration-300">
                {/* Top Fin */}
                <path
                    d="M35 30 Q45 5 65 25 Z"
                    fill={finColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    className="fin-top transition-colors duration-300"
                />

                {/* Bottom Fin */}
                <path
                    d="M40 70 Q50 95 65 75 Z"
                    fill={finColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    className="fin-bottom transition-colors duration-300"
                />

                {/* Tail */}
                <path
                    d="M25 50 L5 25 Q15 50 5 75 Z"
                    fill={finColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    className="tail transition-colors duration-300"
                />

                {/* Body layer bundled together so breathing animation scales the stripes/eyes together */}
                <g className="fish-body transition-colors duration-300">
                    {/* Main Torso */}
                    <ellipse
                        cx="55"
                        cy="50"
                        rx="35"
                        ry="28"
                        fill={bodyColor}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                    />

                    {/* Tropical Pattern Stripes */}
                    <path
                        d="M 35 27 Q 45 50 35 73"
                        fill="none"
                        stroke={stripeColor}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 50 22 Q 60 50 50 78"
                        fill="none"
                        stroke={stripeColor}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                    />

                    {/* Cute Blush */}
                    <ellipse cx="68" cy="48" rx="4" ry="2.5" fill="#FF0054" opacity="0.3" />

                    {/* Cross over eyes for wrong selection mapping */}
                    {isChecking && !isTarget && isWrongSelection ? (
                        <>
                            <line x1="70" y1="35" x2="80" y2="45" stroke={strokeColor} strokeWidth="3" />
                            <line x1="80" y1="35" x2="70" y2="45" stroke={strokeColor} strokeWidth="3" />
                        </>
                    ) : (
                        <>
                            {/* Eye White */}
                            <circle cx="73" cy="38" r="5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="1.5" />
                            {/* Pupil */}
                            <circle cx="75" cy="38" r="2.5" fill="#023047" />
                            {/* Eye catchlight (Reflection) */}
                            <circle cx="76" cy="37" r="1.2" fill="#FFFFFF" />
                        </>
                    )}

                    {/* Mouth - cute smile */}
                    <path d="M82 55 Q86 58 84 62" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
                </g>
            </svg>
        </div>
    );
});

SunfishSVG.displayName = 'SunfishSVG';
