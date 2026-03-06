'use client';

import React from 'react';

interface LilyPadSVGProps {
    size?: number;
    isActive?: boolean;      // currently has the frog
    isHighlighted?: boolean; // shows during demo jump
    isCorrect?: boolean;     // player clicked correctly
    isWrong?: boolean;       // player clicked wrong
    onClick?: () => void;
    className?: string;
}

export function LilyPadSVG({
    size = 80,
    isActive = false,
    isHighlighted = false,
    isCorrect = false,
    isWrong = false,
    onClick,
    className = '',
}: LilyPadSVGProps) {
    let glowFilter = 'none';
    if (isHighlighted) glowFilter = 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.8))';
    if (isCorrect) glowFilter = 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.8))';
    if (isWrong) glowFilter = 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))';
    if (isActive) glowFilter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))';

    return (
        <div
            onClick={onClick}
            className={`transition-all duration-300 cursor-pointer ${className}`}
            style={{
                width: size,
                height: size,
                filter: glowFilter,
            }}
        >
            {/* Ripple animation */}
            {isActive && (
                <div className="absolute inset-0 pointer-events-none">
                    <style jsx>{`
                        @keyframes ripple-ring {
                            0% { transform: scale(0.8); opacity: 0.6; }
                            100% { transform: scale(1.8); opacity: 0; }
                        }
                    `}</style>
                    <div
                        className="absolute rounded-full border-2 border-white/40"
                        style={{
                            top: '10%', left: '10%', width: '80%', height: '80%',
                            animation: 'ripple-ring 1.5s ease-out infinite',
                        }}
                    />
                </div>
            )}

            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ display: 'block' }}>
                {/* Shadow */}
                <ellipse cx="54" cy="56" rx="38" ry="32" fill="rgba(0,0,0,0.15)" />

                {/* Main pad */}
                <ellipse cx="50" cy="50" rx="38" ry="32"
                    fill={isWrong ? '#dc2626' : isCorrect ? '#22c55e' : '#2d8a4e'}
                    stroke={isHighlighted ? '#fbbf24' : '#1a6b34'}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                />

                {/* Veins */}
                <path d="M50 20 Q50 50 50 80" stroke="#1a6b34" strokeWidth="1" fill="none" opacity="0.4" />
                <path d="M50 50 Q30 35 18 28" stroke="#1a6b34" strokeWidth="0.8" fill="none" opacity="0.3" />
                <path d="M50 50 Q70 35 82 28" stroke="#1a6b34" strokeWidth="0.8" fill="none" opacity="0.3" />
                <path d="M50 50 Q30 60 20 72" stroke="#1a6b34" strokeWidth="0.8" fill="none" opacity="0.3" />
                <path d="M50 50 Q70 60 80 72" stroke="#1a6b34" strokeWidth="0.8" fill="none" opacity="0.3" />

                {/* Notch */}
                <path d="M50 18 L44 50 L56 50 Z" fill="#3a6b5e" opacity="0.25" />

                {/* Shine */}
                <ellipse cx="38" cy="40" rx="12" ry="8" fill="rgba(255,255,255,0.12)" transform="rotate(-15 38 40)" />
            </svg>
        </div>
    );
}
