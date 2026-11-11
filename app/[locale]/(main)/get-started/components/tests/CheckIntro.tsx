import { Play } from 'lucide-react';
import GoalVisual, { type GoalVisualId } from '../GoalVisual';
import { checkPrimaryButton } from './check-styles';

// One short intro for every quick check: a live demo of the task, one line, then start.
export default function CheckIntro({
  visual,
  title,
  instructions,
  note,
  startLabel,
  onStart,
}: {
  visual: GoalVisualId;
  title: string;
  instructions: string;
  note?: string;
  startLabel: string;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <GoalVisual goal={visual} live className="mx-auto mb-2 h-24 origin-center scale-125" />
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mx-auto max-w-md text-muted-foreground">{instructions}</p>
      {note && <p className="mx-auto max-w-md text-sm text-muted-foreground/80">{note}</p>}
      <button type="button" onClick={onStart} className={checkPrimaryButton}>
        <Play className="h-4 w-4" aria-hidden="true" />
        {startLabel}
      </button>
    </div>
  );
}
