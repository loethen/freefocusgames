"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Headphones } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { startFlyover } from "./flyover/engine";

/**
 * Homepage hero art: a slow, endless flight over painted grassland, feathered into
 * the page. Links to the white noise page when it exists in this language, and falls
 * back to the cat illustration when WebGL is unavailable.
 */
export default function HeroFlyover({
    fallbackAlt,
    href,
    linkLabel,
}: {
    fallbackAlt: string;
    href?: string;
    linkLabel: string;
}) {
    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!stageRef.current || !canvasRef.current) return;
        const flyover = startFlyover(canvasRef.current, stageRef.current, { feather: true, mode: "hero" });
        if (!flyover) {
            setFailed(true);
            return;
        }
        return () => flyover.destroy();
    }, []);

    if (failed) {
        return (
            <Image
                src="/herocat.png"
                alt={fallbackAlt}
                width={400}
                height={400}
                style={{ maxWidth: "400px", width: "100%", height: "auto" }}
                className="floating-image rounded-full overflow-hidden"
            />
        );
    }

    const stage = (
        <div ref={stageRef} className="relative aspect-[4/3] w-full">
            <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
        </div>
    );

    if (!href) return <div className="w-full max-w-[560px]">{stage}</div>;

    // One link around the scene and its caption; the caption names it and tells visitors it is clickable.
    return (
        <Link
            href={href}
            className="group block w-full max-w-[560px] cursor-pointer rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        >
            {stage}
            <span className="-mt-1 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                <Headphones className="h-4 w-4" aria-hidden="true" />
                <span className="underline decoration-muted-foreground/40 underline-offset-4 transition-[text-decoration-color] duration-300 group-hover:decoration-foreground">
                    {linkLabel}
                </span>
                <ArrowRight className="h-3.5 w-3.5 -translate-x-1.5 opacity-0 transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none" aria-hidden="true" />
            </span>
        </Link>
    );
}
