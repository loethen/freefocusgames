// Decorative Trail Making path for the tests page header: 1 → A → 2 → B → 3.
const NODES = [
    { x: 24, y: 26, label: "1" },
    { x: 78, y: 58, label: "A" },
    { x: 132, y: 26, label: "2" },
    { x: 186, y: 58, label: "B" },
    { x: 240, y: 26, label: "3" },
];
// Time for the line to reach each node within the 6s loop (55% of it is drawing).
const STEP_SECONDS = (6 * 0.55) / (NODES.length - 1);

export function TestsTrailIllustration({ className }: { className?: string }) {
    const path = NODES.map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");

    return (
        <svg viewBox="0 0 264 84" className={className} aria-hidden="true">
            <path d={path} pathLength={1} fill="none" strokeWidth="2" strokeLinecap="round" className="tests-trail-line stroke-foreground/30" />
            {NODES.map(({ x, y, label }, index) => (
                <g key={label}>
                    <circle
                        cx={x}
                        cy={y}
                        r="15"
                        strokeWidth="2"
                        className="tests-trail-node stroke-foreground/40"
                        style={{ animationDelay: `${(index * STEP_SECONDS).toFixed(2)}s` }}
                    />
                    <text
                        x={x}
                        y={y + 5}
                        textAnchor="middle"
                        className="fill-foreground/70 text-[14px] font-semibold"
                    >
                        {label}
                    </text>
                </g>
            ))}
        </svg>
    );
}
