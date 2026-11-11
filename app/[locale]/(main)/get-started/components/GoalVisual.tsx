'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type GoalVisualId = 'focus' | 'memory' | 'speed' | 'relax';

// A tiny looping demo of what each goal's games look like, so a goal reads at a glance
// without a description. The loops are CSS only (see "Get-started goal visuals" in
// globals.css): paused until the surrounding .group is hovered, always running on touch
// screens and inside .gs-live, and still (first frame) under reduced motion.

const STROOP_INKS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
// Order the lit cells play in; the first one is lit in the still frame.
const MEMORY_SEQUENCE = [0, 4, 8, 5];
const MEMORY_STEP = 0.8; // seconds between cells; 4 cells fill the 3.2s loop

function FocusVisual() {
  const t = useTranslations('getStarted.stroopTest.colors');
  // Each word is printed in a different ink, as in the Stroop check.
  const words = [
    { word: t('blue'), ink: STROOP_INKS[0] },
    { word: t('green'), ink: STROOP_INKS[1] },
    { word: t('red'), ink: STROOP_INKS[2] },
  ];
  return (
    <span className="flex flex-col items-center gap-3">
      <span className="grid h-8 place-items-center">
        {words.map((item, index) => (
          <span
            key={item.ink}
            className={cn(
              'gs-anim gs-swap col-start-1 row-start-1 text-2xl font-bold uppercase leading-none tracking-tight',
              index > 0 && 'opacity-0'
            )}
            style={{ color: item.ink, animationDelay: index ? `${index * 1.6 - 4.8}s` : undefined }}
          >
            {item.word}
          </span>
        ))}
      </span>
      <span className="flex gap-1.5">
        {STROOP_INKS.map((ink) => (
          <span key={ink} className="h-2 w-2 rounded-full" style={{ backgroundColor: ink }} />
        ))}
      </span>
    </span>
  );
}

function MemoryVisual() {
  return (
    <span className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 9 }, (_, cell) => {
        const order = MEMORY_SEQUENCE.indexOf(cell);
        return (
          <span key={cell} className="relative h-5 w-5 overflow-hidden rounded-[5px] bg-foreground/10">
            {order >= 0 && (
              <span
                className={cn('gs-anim gs-lit absolute inset-0 bg-primary', order > 0 && 'opacity-0')}
                style={{ animationDelay: order ? `${order * MEMORY_STEP - MEMORY_SEQUENCE.length * MEMORY_STEP}s` : undefined }}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

function SpeedVisual() {
  return (
    <span className="flex flex-col items-center gap-2.5">
      <span className="gs-anim gs-signal h-12 w-12 rounded-full bg-[#22c55e]" />
      <span className="gs-anim gs-readout text-xs font-semibold tabular-nums text-foreground/70">214 ms</span>
    </span>
  );
}

function RelaxVisual() {
  return (
    <span className="relative flex h-16 w-16 items-center justify-center">
      <span className="absolute inset-0 rounded-full border border-foreground/15" />
      <span className="gs-anim gs-breathe h-full w-full rounded-full bg-[#5DCAA5]/45" style={{ transform: 'scale(0.6)' }} />
    </span>
  );
}

const VISUALS: Record<GoalVisualId, () => React.ReactElement> = {
  focus: FocusVisual,
  memory: MemoryVisual,
  speed: SpeedVisual,
  relax: RelaxVisual,
};

export default function GoalVisual({ goal, live = false, className }: { goal: GoalVisualId; live?: boolean; className?: string }) {
  const Visual = VISUALS[goal];
  return (
    <span aria-hidden="true" className={cn('flex items-center justify-center', live && 'gs-live', className)}>
      <Visual />
    </span>
  );
}
