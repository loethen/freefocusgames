"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

declare global {
    interface Window {
        startCaptionCat?: (stage: HTMLElement, lines: string) => () => void;
    }
}

const SCRIPT_SRC = "/captioncat/cat.js";
const STYLE_HREF = "/captioncat/cat.css";
const LINE_CLASS = "captioncat-line";

function loadCatScript(): Promise<void> {
    if (window.startCaptionCat) return Promise.resolve();
    if (!document.querySelector(`link[href="${STYLE_HREF}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = STYLE_HREF;
        document.head.appendChild(link);
    }
    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
        const script = existing ?? document.createElement("script");
        script.addEventListener("load", () => resolve(), { once: true });
        script.addEventListener("error", () => reject(new Error("CaptionCat failed to load")), { once: true });
        if (!existing) {
            script.src = SCRIPT_SRC;
            script.async = true;
            document.body.appendChild(script);
        }
    });
}

// CaptionCat's pixel cat strolls along a line above the footer, as on captioncat.app.
// Clicking it opens the About page, which introduces CaptionCat.
export function CaptionCatFooterCat() {
    const t = useTranslations("common.captionCat");
    const stageRef = useRef<HTMLDivElement>(null);

    // Start the cat only when the footer comes into view, so pages pay nothing until then.
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || !("IntersectionObserver" in window)) return;
        let stop: (() => void) | undefined;
        let cancelled = false;
        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer.disconnect();
            loadCatScript()
                .then(() => {
                    if (!cancelled && window.startCaptionCat) stop = window.startCaptionCat(stage, `.${LINE_CLASS}`);
                })
                .catch(() => {});
        }, { rootMargin: "200px" });
        observer.observe(stage);
        return () => {
            cancelled = true;
            observer.disconnect();
            stop?.();
        };
    }, []);

    return (
        <Link
            href="/about#captioncat"
            aria-label={t("label")}
            className="mb-6 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div ref={stageRef} className="relative h-16 overflow-hidden" aria-hidden="true">
                <span className={`${LINE_CLASS} absolute inset-x-0 bottom-0 h-px bg-border text-[12px]`} />
            </div>
        </Link>
    );
}
