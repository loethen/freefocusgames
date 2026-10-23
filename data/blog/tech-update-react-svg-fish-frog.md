---
title: "Technical Update: Rewriting Fish Trace & Frog Memory Leap in Pure React/SVG"
date: "2026-03-06"
noindex: true
excerpt: "We recently completed a major technical overhaul of our popular cognitive games, Glowing Fish Trace and Frog Memory Leap. By moving away from heavy game engines like Phaser to a pure React and SVG architecture, we've drastically improved performance, mobile responsiveness, and SEO discoverability."
coverImage: "/games/fish-trace.png"
author:
  name: "FreeFocusGames Engineering"
  picture: "/authors/team.png"
keywords: "react game development, svg animation, phaser alternative, multiple object tracking game, web performance optimization, nextjs games, cognitive training games tech stack, adhd web apps"
---

## The Need for Change

When we initially launched **Glowing Fish Trace** (our Multiple Object Tracking game) and **Frog Memory Leap** (our spatial working memory game based on the Corsi block-tapping test), we relied on traditional web game engines. While these engines are powerful for complex 2D games, they introduced several drawbacks for our specific use case:

1.  **Heavy Bundle Sizes**: Loading an entire physics and rendering engine just to move a few elements across the screen is overkill and slows down initial page loads.
2.  **Mobile Responsiveness Issues**: Scaling a `<canvas>` element rigidly across thousands of different mobile device screens often resulted in blurry graphics, awkward black bars, or tiny, unplayable UI elements.
3.  **Black Box Architecture**: A canvas element is essentially a "black box" to the DOM. React state management and standard web accessibility (a11y) tools cannot easily interact with the objects inside the canvas.

## The Solution: Pure React + SVG + CSS Animations

To solve these issues, we undertook a complete architectural rewrite. We stripped out the heavy dependencies and rebuilt the game engines from scratch using **pure React hooks** for state management and **Standard Vector Graphics (SVG)** for rendering.

### 1. The `useGameEngine` Approach
Instead of relying on a game loop `update()` function provided by a third-party framework, we implemented custom React hooks (e.g., `useFishEngine` and `useFrogEngine`). These hooks manage the core game loop using `requestAnimationFrame`, handling state transitions, collision detection, and level progression entirely within the standard React lifecycle.

### 2. SVG for Crisp, Scalable Graphics
By rendering the game objects (fishes, lily pads, frogs) as SVG elements inline within the DOM, we achieved infinite scalability. Whether you are playing on a massive 4K monitor or a compact smartphone screen, the graphics remain razor-sharp without any blurry canvas upscaling.

We also designed dedicated React components for these SVG assets (like `SunfishSVG.tsx` and `FrogSVG.tsx`), allowing us to pass props directly to the graphics. We can change a fish's color from blue to glowing yellow simply by updating a React prop, rather than swapping out sprite sheets.

### 3. CSS-Driven Animations for Performance
For animations like the rippling effect when a frog lands on a lily pad, or the subtle tail-wagging of the fish, we offloaded the work to CSS animations and transitions where possible. Modern browsers are incredibly efficient at hardware-accelerating CSS transforms (`translate`, `scale`, `rotate`), resulting in buttery-smooth 60fps performance even on low-end mobile devices.

## The Impact

The results of this migration have been overwhelmingly positive:

*   **Lightning-Fast Load Times**: Time-to-Interactive (TTI) has dropped significantly. Players can jump into the cognitive exercises instantly.
*   **Flawless Mobile Experience**: By utilizing standard CSS layout techniques (like Flexbox and aspect ratios) combined with scalable SVGs, the games now fit perfectly on any device. The interactive areas are large enough for touch screens, solving previous frustration points.

## Built for Cognitive Training

Replacing generic descriptions, we've updated the focus of these apps to target specific cognitive benefits. For **Glowing Fish Trace**, the experience is tailored for **Multiple Object Tracking (MOT)**, sports vision training, and ADHD focus exercises. For **Frog Memory Leap**, the core mechanics reflect the **Corsi block-tapping test**, enhancing working memory and cognitive plasticity.

These scientific foundations help users seeking cognitive improvements find and utilize our free tools more effectively.

## Try the New Experience

We invite you to experience the smoother, faster, and more responsive versions of these games:

*   [Play Glowing Fish Trace](/games/fish-trace) - Improve your visual tracking and sustained attention.
*   [Play Frog Memory Leap](/games/frog-memory-leap) - Challenge your spatial working memory.

We are committed to continuously improving the FreeFocusGames platform to provide the best possible cognitive training tools. Stay tuned for more updates!
