"use client";

import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef, useEffect, useRef } from "react";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string;
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean;
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean;
  /**
   * Content to be displayed in the marquee
   */
  children: React.ReactNode;
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean;
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className,
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
              "animate-marquee flex-row": !vertical,
              "animate-marquee-vertical flex-col": vertical,
              "group-hover:[animation-play-state:paused]": pauseOnHover,
              "[animation-direction:reverse]": reverse,
            })}
          >
            {children}
          </div>
        ))}
    </div>
  );
}

interface SingleTrackMarqueeProps extends ComponentPropsWithoutRef<"div"> {
  reverse?: boolean;
  pauseOnHover?: boolean;
  duration?: number;
  trackClassName?: string;
  children: React.ReactNode;
}

/**
 * Moves one copy of its content between the two edges of the viewport.
 * This keeps indexable text unique while preserving the marquee treatment.
 */
export function SingleTrackMarquee({
  className,
  reverse = false,
  pauseOnHover = false,
  duration = 20,
  trackClassName,
  children,
  ...props
}: SingleTrackMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;

    if (!container || !track) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateAnimation = () => {
      animationRef.current?.cancel();
      animationRef.current = null;
      track.style.transform = "";

      const distance = Math.max(track.scrollWidth - container.clientWidth, 0);
      if (distance === 0 || reducedMotion.matches) return;

      animationRef.current = track.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          {
            transform: `translate3d(${reverse ? distance : -distance}px, 0, 0)`,
          },
        ],
        {
          duration: Math.max(duration, 1) * 1000,
          easing: "ease-in-out",
          iterations: Infinity,
          direction: "alternate",
        },
      );
    };

    const resizeObserver = new ResizeObserver(updateAnimation);
    resizeObserver.observe(container);
    resizeObserver.observe(track);
    reducedMotion.addEventListener("change", updateAnimation);
    updateAnimation();

    return () => {
      resizeObserver.disconnect();
      reducedMotion.removeEventListener("change", updateAnimation);
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, [duration, reverse]);

  const pause = () => {
    if (pauseOnHover) animationRef.current?.pause();
  };

  const resume = () => {
    if (pauseOnHover) animationRef.current?.play();
  };

  return (
    <div
      {...props}
      ref={containerRef}
      className={cn(
        "flex overflow-x-auto p-2 motion-safe:overflow-hidden",
        reverse
          ? "motion-safe:justify-end motion-reduce:justify-start"
          : "justify-start",
        className,
      )}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div
        ref={trackRef}
        className={cn(
          "flex w-max min-w-full shrink-0 items-stretch gap-4 will-change-transform",
          trackClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
