import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

// A pill link whose dot spreads to fill it on hover. The label stays put and turns white;
// an arrow fades in at the right. It is a single link (no button inside), so it takes one
// tab stop and shows a focus ring.
export function InteractiveHoverLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative isolate inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full border border-foreground/15 bg-background pl-[22px] pr-[30px] font-semibold text-foreground",
        "transition-[color,border-color,scale] duration-500 hover:border-foreground hover:text-background active:scale-[0.98] active:duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        EASE,
        className
      )}
    >
      {/* The dot that spreads; it sits behind the label. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-[22px] top-1/2 -z-10 h-2 w-2 -translate-y-1/2 rounded-full bg-foreground transition-[scale] duration-[600ms] group-hover:scale-[80] motion-reduce:transition-none",
          EASE
        )}
      />
      <span aria-hidden="true" className="h-2 w-2 shrink-0" />
      <span className={cn("transition-[translate] duration-500 group-hover:-translate-x-2 motion-reduce:transition-none", EASE)}>
        {children}
      </span>
      <ArrowRight
        aria-hidden="true"
        className={cn(
          "absolute right-4 h-4 w-4 -translate-x-1.5 opacity-0 transition-[opacity,translate] duration-500 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none",
          EASE
        )}
      />
    </Link>
  );
}
