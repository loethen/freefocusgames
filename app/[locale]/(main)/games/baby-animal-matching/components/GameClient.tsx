'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FlipCard from './FlipCard';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl'; // Needed for results UI text
import { ShareModal } from '@/components/ui/ShareModal'; // Needed for share button
import confetti from 'canvas-confetti';
import { useTimeout } from '@/hooks/useTimeout'; // Import custom hook
import { cn } from '@/lib/utils'; // Import cn utility

// Base structure for animal data
interface AnimalData {
  id: number;
  url: string;
}

// Internal state structure for cards in the game
interface InternalCardData {
  id: number; // Unique ID for the card instance (0 to 15)
  animalId: number; // ID of the animal image (0 to 7)
  imageUrl: string;
  isFlipped: boolean;
  matched: boolean;
}

// Local animal illustrations keep the card set consistent and avoid relying on remote photos.
const animals: AnimalData[] = [
  { id: 0, url: "/games/baby-animal-matching/animal-0.png" }, // Gray kitten
  { id: 1, url: "/games/baby-animal-matching/animal-1.png" }, // Duckling
  { id: 2, url: "/games/baby-animal-matching/animal-2.png" }, // Baby elephant
  { id: 3, url: "/games/baby-animal-matching/animal-3.png" }, // Monkey
  { id: 4, url: "/games/baby-animal-matching/animal-4.png" }, // Lamb
  { id: 5, url: "/games/baby-animal-matching/animal-5.png" }, // Orange kitten
  { id: 6, url: "/games/baby-animal-matching/animal-6.png" }, // Lion cub
  { id: 7, url: "/games/baby-animal-matching/animal-7.png" }, // Fawn/deer
];

// Define difficulty levels
const difficultySettings = [
  { level: 0, cols: 3, rows: 2, numPairs: 3, label: 'Easy (3x2)' },
  { level: 1, cols: 4, rows: 2, numPairs: 4, label: 'Medium (4x2)' },
  { level: 2, cols: 4, rows: 3, numPairs: 6, label: 'Hard (4x3)' },
  { level: 3, cols: 4, rows: 4, numPairs: 8, label: 'Expert (4x4)' },
];

const gridLayouts = [
  { maxWidth: 'max-w-lg', cardHeightClass: 'pb-[110%]' },
  { maxWidth: 'max-w-2xl', cardHeightClass: 'pb-[110%]' },
  { maxWidth: 'max-w-lg', cardHeightClass: 'pb-[105%]' },
  { maxWidth: 'max-w-sm', cardHeightClass: 'pb-[100%]' },
] as const;

function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

// Modified to accept numPairs
const createInitialCards = (numPairs: number): InternalCardData[] => {
  // Ensure we have enough base animals for the requested pairs
  const availableAnimals = animals.slice(0, Math.min(numPairs, animals.length));
  if (availableAnimals.length < numPairs) {
    console.warn(`Requested ${numPairs} pairs, but only ${availableAnimals.length} unique animals are defined. Using ${availableAnimals.length} pairs.`);
    numPairs = availableAnimals.length; // Adjust numPairs if necessary
  }
  const pairedAnimals = [...availableAnimals, ...availableAnimals];
  const shuffledPairs = shuffleArray(pairedAnimals);

  return shuffledPairs.map((animal, index) => ({
    id: index,
    animalId: animal.id,
    imageUrl: animal.url,
    isFlipped: false,
    matched: false,
  }));
};

// Function to preload images
const preloadImages = (urls: string[]): Promise<void[]> => {
    const promises = urls.map((url) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = (err) => reject(err);
      });
    });
    return Promise.all(promises);
  };

export default function GameClient() {
  const t = useTranslations("games.babyAnimalMatching.gameUI"); // Add translation hook
  const [difficultyLevel, setDifficultyLevel] = useState<number>(0); // Default: Easy (3x2)
  const [cards, setCards] = useState<InternalCardData[]>([]); // Initialize empty
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [matchingCards, setMatchingCards] = useState<Set<number>>(new Set()); // New state
  // State for results UI
  const [startTime, setStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState(false); // For share button
  const [checkDelay, setCheckDelay] = useState<number | null>(null); // State for the timeout delay

  // Derive grid configuration from difficulty level
  const gridConfig = useMemo(() => {
      return difficultySettings[difficultyLevel];
  }, [difficultyLevel]);
  const gridLayout = gridLayouts[difficultyLevel];

  // Load best time
  useEffect(() => {
      const savedBestTime = localStorage.getItem(`animalMatchBestTime_${gridConfig.numPairs}`);
      if (savedBestTime) {
          setBestTime(parseFloat(savedBestTime));
      } else {
          setBestTime(null);
      }
  }, [gridConfig.numPairs]); 

  // Update best time function
  const updateBestTime = useCallback((newTime: number) => {
      const key = `animalMatchBestTime_${gridConfig.numPairs}`;
      if (bestTime === null || newTime < bestTime) {
          setBestTime(newTime);
          localStorage.setItem(key, newTime.toString());
      }
  }, [bestTime, gridConfig.numPairs]); // Include dependencies

  // Initialize game and preload images on mount or when gridConfig changes
  useEffect(() => {
    setIsLoading(true);
    setShowResults(false); 
    setCheckDelay(null); // Ensure delay is null on init
    setMatchingCards(new Set()); // Clear matching state
    const uniqueUrls = [...new Set(animals.map(a => a.url))]; 

    preloadImages(uniqueUrls)
      .then(() => {
        console.log("Images loaded successfully");
        setCards(createInitialCards(gridConfig.numPairs)); // Use numPairs from config
        setFlippedIndices([]);
        setIsChecking(false);
        setMoves(0);
        setStartTime(Date.now()); 
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to preload images:", error);
        setIsLoading(false);
      });
  }, [gridConfig.numPairs]); 

  const resetGame = useCallback(() => {
      setIsLoading(true); 
      setShowResults(false); 
      setCheckDelay(null); // Ensure delay is null on reset
      setMatchingCards(new Set()); // Clear matching state
      setCards(createInitialCards(gridConfig.numPairs)); // Use current numPairs
      setFlippedIndices([]);
      setIsChecking(false);
      setMoves(0);
      setGameTime(0); 
      // Re-load best time for the current difficulty
      const savedBestTime = localStorage.getItem(`animalMatchBestTime_${gridConfig.numPairs}`);
      setBestTime(savedBestTime ? parseFloat(savedBestTime) : null);
      setTimeout(() => {
          setStartTime(Date.now()); 
          setIsLoading(false);
      }, 100);
  }, [gridConfig.numPairs]); // Depend on numPairs

  // Callback for the main check logic after delay
  const checkMatchCallback = useCallback(() => {
    if (flippedIndices.length !== 2) return;

    const [firstIndex, secondIndex] = flippedIndices;

    setCards(currentCards => {
      const card1 = currentCards[firstIndex];
      const card2 = currentCards[secondIndex];

      if (!card1 || !card2) {
        setFlippedIndices([]);
        setIsChecking(false);
        setCheckDelay(null);
        return currentCards;
      }
      
      setMoves((prevMoves) => prevMoves + 1);

      if (card1.animalId === card2.animalId) {
        // Match found
        const nextCards = currentCards.map((card) =>
          card.animalId === card1.animalId ? { ...card, matched: true } : card
        );
        
        // Trigger animation by adding to matchingCards set
        setMatchingCards(prevSet => new Set(prevSet).add(card1.id).add(card2.id));

        setFlippedIndices([]);
        setIsChecking(false);
        setCheckDelay(null);
        return nextCards; // Return updated cards

      } else {
        // No match: Flip back after another delay
        setTimeout(() => {
          setCards(prevCards => prevCards.map((card, index) =>
            index === firstIndex || index === secondIndex
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedIndices([]);
          setIsChecking(false);
          setCheckDelay(null); 
        }, 800); 
        
        return currentCards;
      }
    });
  }, [flippedIndices]); 

  // Use the custom hook
  useTimeout(checkMatchCallback, checkDelay);

  // Effect to TRIGGER the check delay when 2 cards are flipped
  useEffect(() => {
    if (flippedIndices.length === 2) {
      setIsChecking(true);  // Block clicks immediately
      setCheckDelay(550); // Schedule the check via useTimeout
    }
  }, [flippedIndices.length]); 

  // Check for game over when cards change
  useEffect(() => {
    if (cards.length > 0 && !showResults && cards.every((card) => card.matched)) {
      const endTime = Date.now();
      const elapsedTime = (endTime - startTime) / 1000; 
      const timer = setTimeout(() => {
        setGameTime(elapsedTime);
        updateBestTime(elapsedTime); 
        setShowResults(true);
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, zIndex: 100 }); 
      }, 600); 
      return () => clearTimeout(timer);
    }
  }, [cards, startTime, showResults, updateBestTime]);

  const handleCardClick = (index: number) => {
    const card = cards[index];
    if (isLoading || isChecking || checkDelay !== null || !card || card.isFlipped || card.matched || matchingCards.has(card.id) || flippedIndices.length === 2) {
      return;
    }
    setCards((prevCards) =>
      prevCards.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
    setFlippedIndices((prevIndices) => [...prevIndices, index]);
  };

  const handleDifficultyChange = (newLevel: number) => {
      // Prevent changing difficulty if game is active or loading
      if ((moves > 0 && !showResults) || isLoading) return; 
      setDifficultyLevel(newLevel);
      // Reset logic is handled by useEffect dependency on gridConfig.numPairs
  };

  return (
    <div className="flex flex-col relative rounded-xl items-center w-full mx-auto px-4 py-8 bg-gradient-to-br from-green-300 to-blue-300">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white drop-shadow-lg z-10">
            {t('title', { defaultMessage: 'Baby Animal Matching' })}
        </h1>
        
        <div className={`flex justify-between items-center w-full max-w-3xl mb-6 px-2 z-10`}>
            <p className="text-xl font-semibold text-white drop-shadow">
                {t('moves', { defaultMessage: 'Moves' })}: {moves}
            </p>
            <Button onClick={resetGame} variant="secondary" size="sm" disabled={isLoading}>
                {t('resetGame', { defaultMessage: 'Reset Game' })}
            </Button>
        </div>

        {isLoading && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20 rounded-xl">
                 <p className="text-white text-2xl font-semibold">
                     {t('loadingImages', { defaultMessage: 'Loading Images...' })}
                 </p>
            </div>
        )}

        <div className={cn(
            "grid gap-2 sm:gap-4 w-full mb-6",
            gridLayout.maxWidth,
            gridConfig.cols === 3 && "grid-cols-3",
            gridConfig.cols === 4 && "grid-cols-4"
        )}> 
            {cards.map((card) => ( 
            <FlipCard
                key={card.id} 
                card={card} 
                index={card.id} 
                isFlipped={card.isFlipped}
                matched={card.matched}
                isGameOver={showResults}
                onClick={handleCardClick}
                isMatching={matchingCards.has(card.id)}
                cardHeightClass={gridLayout.cardHeightClass}
            />
            ))}
        </div>

        <div className="w-full max-w-3xl z-10 mb-2">
            <p className="text-white font-medium mb-2 text-center">
                {t('difficulty', { defaultMessage: 'Difficulty' })}:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                {difficultySettings.map((setting) => (
                    <Button
                        key={setting.level}
                        variant={difficultyLevel === setting.level ? "default" : "secondary"}
                        size="sm"
                        disabled={(moves > 0 && !showResults) || isLoading}
                        onClick={() => handleDifficultyChange(setting.level)}
                        className="min-w-[80px]"
                    >
                        {t(setting.label.split(' ')[0].toLowerCase(), { defaultMessage: setting.label.split(' ')[0] })} ({setting.cols}×{setting.rows})
                    </Button>
                ))}
            </div>
        </div>

        {showResults && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 w-full max-w-sm text-gray-800 dark:text-gray-200">
                    <h3 className="text-2xl font-bold text-center mb-4">
                        {t('resultsTitle', { defaultMessage: 'Well Done!' })}
                    </h3>
                    <div className="space-y-2">
                        <p className="flex justify-between gap-4">
                            <span>{t('finalMoves', { defaultMessage: 'Moves' })}:</span>
                            <span className="font-bold">{moves}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span>{t('time', { defaultMessage: 'Time' })}:</span>
                            <span className="font-bold">{gameTime.toFixed(1)}s</span>
                        </p>
                         <p className="flex justify-between gap-4">
                            <span>{t('bestTime', { defaultMessage: 'Best Time' })} ({gridConfig.label.split(' ')[0]}):</span>
                            <span className="font-bold">
                                {bestTime !== null ? `${bestTime.toFixed(1)}s` : 'N/A'}
                            </span>
                        </p>
                         <p className="flex justify-between gap-4">
                            <span>{t('difficultyLevel', { defaultMessage: 'Difficulty' })}:</span>
                            <span className="font-bold">{t(gridConfig.label.split(' ')[0].toLowerCase(), { defaultMessage: gridConfig.label })}</span>
                        </p>
                    </div>
                    <div className="flex gap-2 justify-center mt-6">
                        <Button onClick={resetGame}>
                            {t('playAgain', { defaultMessage: 'Play Again' })}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowShareModal(true)}
                        >
                            {t('shareResults', { defaultMessage: 'Share Results' })}
                        </Button>
                    </div>
                </div>
            </div>
        )}

        <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            title={t('shareTitle', {defaultMessage: "Share Your Score!"})}
            shareText={t('shareText', {
                difficulty: t(gridConfig.label.split(' ')[0].toLowerCase(), { defaultMessage: gridConfig.label }),
                moves: moves,
                time: gameTime.toFixed(1),
                defaultValue: `I completed the ${gridConfig.label} Baby Animal Matching game in ${moves} moves and ${gameTime.toFixed(1)} seconds!`
             })}
        />
    </div>
  );
}
