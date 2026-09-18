'use client';

import React from "react";
import Image from "next/image"; // Re-add Image import
import { cn } from "@/lib/utils";

// Removed SVG imports

interface CardData {
    id: number;
    animalId: number;
    imageUrl: string; // Ensure this is part of the data
}

// Removed animalComponentMap

interface FlipCardProps {
    card: CardData;
    index: number;
    isFlipped: boolean;
    matched: boolean;
    isGameOver: boolean;
    onClick: (index: number) => void; // Removed event
    isMatching?: boolean; // Added isMatching prop
    cardHeightClass?: 'pb-[110%]' | 'pb-[105%]' | 'pb-[100%]';
}

const FlipCard: React.FC<FlipCardProps> = ({
    card,
    index,
    isFlipped,
    matched,
    isGameOver,
    onClick,
    isMatching, // Destructure isMatching
    cardHeightClass = 'pb-[120%]',
}) => {
    const handleClick = () => { 
        // Prevent click if matching animation is running
        if (!isGameOver && !matched && !isMatching) { 
            onClick(index);
        }
    };

    // Removed AnimalSvgComponent logic

    return (
        <div
            onClick={handleClick}
            // Apply animation class directly to outer div based on isMatching
            className={cn(
                "perspective-[1000px] cursor-pointer",
                 // Removed separate transition/opacity/scale styles
                 isMatching && 'animate-card-match-effect' // Apply combined animation class
            )}
        >
            <div
                className={cn(
                    `relative w-full h-0 ${cardHeightClass} transform-3d transition-transform duration-500`,
                    // Apply hover only if NOT matching 
                    !isMatching && 'hover:scale-105', 
                    // Always rotate if flipped or matched, regardless of matching animation
                    (isFlipped || matched) && 'rotate-y-180', 
                    isGameOver && 'opacity-70', // Keep game over style
                    // Keep blue ring for matched, but animation will visually override
                    matched && 'ring-2 ring-offset-2 ring-blue-500 rounded-xl'
                )}
            >
                {/* Front of card */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                    <div className="w-full h-full bg-white rounded-xl shadow-md flex items-center justify-center"> 
                        <span className="text-blue-500 text-4xl font-bold">?</span> 
                    </div>
                </div>

                {/* Back of card - Uses next/image */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                    <div className="relative w-full h-full bg-white rounded-xl shadow-md flex flex-col items-center justify-center overflow-hidden">
                        {/* Container for the Image - keeps the padding for border effect */}
                        <div className="absolute inset-0 p-[10px]">
                             <Image
                                src={card.imageUrl}
                                alt={`Baby Animal ${card.animalId}`}
                                layout="fill" // Fills the container
                                objectFit="cover" // Covers the area, might crop
                                className="rounded-md" // Apply rounding
                                quality={100} // Highest quality
                                unoptimized={process.env.NODE_ENV === 'development'} // Optional for local dev
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlipCard;
