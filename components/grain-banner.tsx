"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

// A soft, grainy gradient banner: a cool-to-warm base, four drifting colour blobs, canvas
// film grain, and a faint pattern of lens shapes. On hover the blobs lean toward the cursor,
// the pattern leans away, and a soft light follows the pointer, all driven by a spring.
// Every decorative layer is aria-hidden; the children stay ordinary, crawlable HTML.

const STIFFNESS = 70;
const DAMPING_RATIO = 0.86;
const DAMPING = 2 * DAMPING_RATIO * Math.sqrt(STIFFNESS); // unit mass

const BLOB_SHIFT = 36; // px the blobs move toward the cursor at the edge
const PATTERN_SHIFT = 10; // px the pattern moves the other way

// Sky grey to rust red, neighbours on the colour wheel.
const BLOBS = [
    { className: "grain-blob-a", style: { left: "-12%", top: "-35%", background: "radial-gradient(closest-side, rgba(196, 211, 224, 0.95), transparent)" } },
    { className: "grain-blob-b", style: { right: "-8%", top: "-30%", background: "radial-gradient(closest-side, rgba(250, 204, 168, 0.9), transparent)" } },
    { className: "grain-blob-c", style: { left: "-6%", bottom: "-50%", background: "radial-gradient(closest-side, rgba(226, 104, 58, 0.9), transparent)" } },
    { className: "grain-blob-d", style: { right: "-12%", bottom: "-45%", background: "radial-gradient(closest-side, rgba(170, 66, 34, 0.9), transparent)" } },
];

// Lens (vesica) shapes: two circular arcs meeting at points, arranged in rings like petals.
// The geometry is the point: a quiet hint of measurement and maths behind the page.
function lensPath(length: number, width: number) {
    const half = length / 2;
    const radius = (half * half + (width / 2) * (width / 2)) / width;
    return `M0 ${-half} A${radius} ${radius} 0 0 1 0 ${half} A${radius} ${radius} 0 0 1 0 ${-half}Z`;
}
const LENS_RINGS = [
    { count: 8, distance: 230, length: 150, width: 46, offset: 0 },
    { count: 12, distance: 430, length: 210, width: 60, offset: 15 },
];

function useGrain(ref: RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const dpr = window.devicePixelRatio || 1;
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const image = ctx.createImageData(128, 128);
        for (let i = 0; i < image.data.length; i += 4) {
            const v = Math.random() * 255;
            image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
            image.data[i + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
        el.style.backgroundImage = `url(${canvas.toDataURL()})`;
        // One noise pixel per physical pixel.
        el.style.backgroundSize = `${128 / dpr}px ${128 / dpr}px`;
    }, [ref]);
}

export function GrainBanner({ children, className }: { children: ReactNode; className?: string }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const grainRef = useRef<HTMLDivElement>(null);
    useGrain(grainRef);

    useEffect(() => {
        const root = rootRef.current;
        if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        // Spring state for the lean (x, y in -0.5..0.5) and the glow opacity.
        const pos = { x: 0, y: 0, o: 0 };
        const vel = { x: 0, y: 0, o: 0 };
        const target = { x: 0, y: 0, o: 0 };
        const glow = { x: 50, y: 50 };
        let frame = 0;
        let last = 0;

        const apply = () => {
            root.style.setProperty("--grain-bx", `${pos.x * BLOB_SHIFT}px`);
            root.style.setProperty("--grain-by", `${pos.y * BLOB_SHIFT}px`);
            root.style.setProperty("--grain-px", `${-pos.x * PATTERN_SHIFT}px`);
            root.style.setProperty("--grain-py", `${-pos.y * PATTERN_SHIFT}px`);
            root.style.setProperty("--grain-go", `${Math.max(0, pos.o)}`);
            root.style.setProperty("--grain-gx", `${glow.x}%`);
            root.style.setProperty("--grain-gy", `${glow.y}%`);
        };

        const step = (now: number) => {
            const dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016);
            last = now;
            let moving = false;
            for (const key of ["x", "y", "o"] as const) {
                const accel = -STIFFNESS * (pos[key] - target[key]) - DAMPING * vel[key];
                vel[key] += accel * dt;
                pos[key] += vel[key] * dt;
                if (Math.abs(vel[key]) > 0.0005 || Math.abs(pos[key] - target[key]) > 0.0005) moving = true;
            }
            apply();
            frame = moving ? requestAnimationFrame(step) : 0;
            if (!moving) last = 0;
        };
        const kick = () => {
            if (!frame) frame = requestAnimationFrame(step);
        };

        const onMove = (event: PointerEvent) => {
            const box = root.getBoundingClientRect();
            const rx = (event.clientX - box.left) / box.width;
            const ry = (event.clientY - box.top) / box.height;
            target.x = rx - 0.5;
            target.y = ry - 0.5;
            target.o = 1;
            glow.x = rx * 100;
            glow.y = ry * 100;
            kick();
        };
        const onLeave = () => {
            target.x = 0;
            target.y = 0;
            target.o = 0;
            kick();
        };

        root.addEventListener("pointermove", onMove);
        root.addEventListener("pointerleave", onLeave);
        return () => {
            root.removeEventListener("pointermove", onMove);
            root.removeEventListener("pointerleave", onLeave);
            cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div
            ref={rootRef}
            className={`relative isolate overflow-hidden rounded-[20px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.14)] ${className ?? ""}`}
            style={{ background: "linear-gradient(180deg, #c7d0d9 0%, #e9b896 42%, #d7693f 75%, #9c3c1f 100%)" }}
        >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0" style={{ transform: "translate3d(var(--grain-bx, 0px), var(--grain-by, 0px), 0)" }}>
                    {BLOBS.map((blob) => (
                        <div key={blob.className} className={`grain-blob absolute h-[110%] w-[60%] ${blob.className}`} style={blob.style} />
                    ))}
                </div>

                <svg
                    className="absolute inset-0 h-full w-full"
                    style={{
                        transform: "translate3d(var(--grain-px, 0px), var(--grain-py, 0px), 0)",
                        maskImage: "radial-gradient(ellipse 55% 60% at 50% 50%, transparent 35%, black 85%)",
                        WebkitMaskImage: "radial-gradient(ellipse 55% 60% at 50% 50%, transparent 35%, black 85%)",
                    }}
                    preserveAspectRatio="xMidYMid slice"
                    viewBox="0 0 1200 400"
                >
                    <g fill="none" stroke="white" strokeWidth="0.8" opacity="0.32" transform="translate(600 200)">
                        {LENS_RINGS.flatMap((ring) =>
                            Array.from({ length: ring.count }, (_, i) => {
                                const angle = ring.offset + (360 / ring.count) * i;
                                return (
                                    <path
                                        key={`${ring.distance}-${i}`}
                                        d={lensPath(ring.length, ring.width)}
                                        transform={`rotate(${angle}) translate(0 ${-ring.distance})`}
                                    />
                                );
                            })
                        )}
                        <circle r="300" />
                        <circle r="520" />
                    </g>
                </svg>

                <div
                    className="absolute inset-0"
                    style={{
                        opacity: "var(--grain-go, 0)",
                        background: "radial-gradient(240px circle at var(--grain-gx, 50%) var(--grain-gy, 50%), rgba(255, 255, 255, 0.28), transparent 70%)",
                    }}
                />

                <div ref={grainRef} className="absolute inset-0 opacity-40 mix-blend-overlay" />
            </div>

            {children}
        </div>
    );
}
