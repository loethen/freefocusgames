import { useState, useRef, useCallback } from 'react';

export type GamePhase = 'idle' | 'watching' | 'tracking' | 'selecting' | 'completed';

export interface Fish {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    isTarget: boolean;
    isSelected: boolean;
    isChecking: boolean; // Indicates the fish is being revealed at the end
    isWrongSelection: boolean;
}

export function useFishEngine({
    containerWidth,
    containerHeight,
    fishCount,
    targetCount,
    speedMultiplier = 1,
    onCollision
}: {
    containerWidth: number;
    containerHeight: number;
    fishCount: number;
    targetCount: number;
    speedMultiplier?: number;
    onCollision?: () => void;
}) {
    const minSpeed = -80 * speedMultiplier;
    const maxSpeed = 80 * speedMultiplier;
    // We scale speed to match the container relative motion
    const speedScale = Math.min(containerWidth, containerHeight) / 1000;

    const fishesRef = useRef<Record<number, Fish>>({});
    // Need a stable way to update React for re-rendering UI ONLY when state changes (like selection),
    // but we use requestAnimationFrame for fluid movement without React renders
    const [renderTrigger, setRenderTrigger] = useState(0);
    const isMovingRef = useRef(false);
    const animationRef = useRef<number>(0);

    const getRandomVelocity = useCallback(() => {
        // Avoid speeds too close to 0
        let v = (Math.random() * (maxSpeed - minSpeed) + minSpeed) * speedScale;
        if (Math.abs(v) < 20 * speedScale) {
            v = v > 0 ? 20 * speedScale : -20 * speedScale;
        }
        return v;
    }, [maxSpeed, minSpeed, speedScale]);

    const initFishes = useCallback(() => {
        const newFishes: Record<number, Fish> = {};

        // Select random targets
        const targetIndices = new Set<number>();
        while (targetIndices.size < targetCount) {
            targetIndices.add(Math.floor(Math.random() * fishCount));
        }

        for (let i = 0; i < fishCount; i++) {
            newFishes[i] = {
                id: i,
                // keep slightly away from edges
                x: 60 + Math.random() * (containerWidth - 120),
                y: 60 + Math.random() * (containerHeight - 120),
                vx: getRandomVelocity(),
                vy: getRandomVelocity(),
                isTarget: targetIndices.has(i),
                isSelected: false,
                isChecking: false,
                isWrongSelection: false
            };
        }
        fishesRef.current = newFishes;
        setRenderTrigger(prev => prev + 1);
    }, [fishCount, targetCount, containerWidth, containerHeight, getRandomVelocity]);

    const startMovement = useCallback(() => {
        isMovingRef.current = true;
        let lastTime = performance.now();

        const fishRadius = 40;

        const loop = (time: number) => {
            if (!isMovingRef.current) return;

            const deltaTime = (time - lastTime) / 1000; // seconds
            lastTime = time;

            // Optional cap on deltaTime to prevent tunneling on lag
            const dt = Math.min(deltaTime, 0.1);

            const fishes = Object.values(fishesRef.current);

            // Update positions
            for (let i = 0; i < fishes.length; i++) {
                const fish = fishes[i];
                fish.x += fish.vx * dt;
                fish.y += fish.vy * dt;

                // Wall collisions
                if (fish.x <= fishRadius) {
                    fish.x = fishRadius;
                    fish.vx = Math.abs(fish.vx);
                } else if (fish.x >= containerWidth - fishRadius) {
                    fish.x = containerWidth - fishRadius;
                    fish.vx = -Math.abs(fish.vx);
                }

                if (fish.y <= fishRadius) {
                    fish.y = fishRadius;
                    fish.vy = Math.abs(fish.vy);
                } else if (fish.y >= containerHeight - fishRadius) {
                    fish.y = containerHeight - fishRadius;
                    fish.vy = -Math.abs(fish.vy);
                }
            }

            // Simple Circle Collision between fishes
            for (let i = 0; i < fishes.length; i++) {
                for (let j = i + 1; j < fishes.length; j++) {
                    const f1 = fishes[i];
                    const f2 = fishes[j];

                    const dx = f2.x - f1.x;
                    const dy = f2.y - f1.y;
                    const distSq = dx * dx + dy * dy;
                    const minDist = fishRadius * 1.5; // Avoid getting totally stuck, using a slightly smaller collision radius

                    if (distSq < minDist * minDist) {
                        // Swap velocities (elastic-ish collision)
                        const tempVx = f1.vx;
                        const tempVy = f1.vy;
                        f1.vx = f2.vx;
                        f1.vy = f2.vy;
                        f2.vx = tempVx;
                        f2.vy = tempVy;

                        // Push apart slightly to prevent sticking
                        const dist = Math.sqrt(distSq) || 1;
                        const overlap = (minDist - dist) / 2;
                        const nx = dx / dist;
                        const ny = dy / dist;

                        f1.x -= nx * overlap;
                        f1.y -= ny * overlap;
                        f2.x += nx * overlap;
                        f2.y += ny * overlap;

                        if (onCollision) onCollision();
                    }
                }
            }

            // To sync DOM with refs, we don't trigger React render! 
            // We'll directly mutate DOM elements via another mechanism, or just force sync if really needed.
            // Wait, actually forcing a React render at 60fps for ~15 pure inline-style divs is surprisingly fine in NextJS 14+,
            // but for absolute silkiness, we should drive DOM manually. We'll use refs in the component to update styled via transform.
            // Let's fire a custom event or callback to the parent so it can sync DOM directly.

            // We will just expose the raw ref, and parent component sets up a sync loop.

            animationRef.current = requestAnimationFrame(loop);
        };
        animationRef.current = requestAnimationFrame(loop);
    }, [containerWidth, containerHeight, onCollision]);

    const stopMovement = useCallback(() => {
        isMovingRef.current = false;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }, []);

    const toggleSelection = useCallback((id: number) => {
        const fish = fishesRef.current[id];
        if (fish) {
            fish.isSelected = !fish.isSelected;
            // Force pure React render on interaction
            setRenderTrigger(prev => prev + 1);
        }
    }, []);

    const markResults = useCallback(() => {
        Object.values(fishesRef.current).forEach(fish => {
            fish.isChecking = true;
            if (fish.isSelected && !fish.isTarget) {
                fish.isWrongSelection = true;
            }
        });
        setRenderTrigger(prev => prev + 1);
    }, []);

    return {
        fishesRef,
        initFishes,
        startMovement,
        stopMovement,
        toggleSelection,
        markResults,
        renderTrigger // use this to force React to update UI elements like strokes
    };
}
