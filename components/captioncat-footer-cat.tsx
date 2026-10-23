"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

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
// Hover (or a first tap on touch screens) shows what it is; a click opens the CaptionCat site.
export function CaptionCatFooterCat() {
    const t = useTranslations("common.captionCat");
    const locale = useLocale();
    const stageRef = useRef<HTMLDivElement>(null);
    const [bubble, setBubble] = useState<{ left: number } | null>(null);

    const href = `https://captioncat.app/${locale === "zh" ? "zh/" : ""}?utm_source=freefocusgames&utm_medium=referral&utm_campaign=footer_cat`;

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

    // Place the bubble above wherever the cat is right now.
    const showBubble = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const stageBox = stage.getBoundingClientRect();
        const cat = stage.querySelector<HTMLElement>(".ytc-mascot");
        const catBox = cat?.getBoundingClientRect();
        const center = catBox && catBox.width ? catBox.left + catBox.width / 2 - stageBox.left : stageBox.width / 2;
        setBubble({ left: Math.min(Math.max(center, 130), stageBox.width - 130) });
    }, []);

    const hideBubble = useCallback(() => setBubble(null), []);

    // On touch screens the first tap explains, the second one follows the link.
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        if (!bubble && window.matchMedia("(pointer: coarse)").matches) {
            event.preventDefault();
            showBubble();
        }
    };

    return (
        <div className="relative mb-6">
            {bubble && (
                <div
                    role="tooltip"
                    id="captioncat-bubble"
                    className="pointer-events-none absolute bottom-full z-10 mb-1 w-60 -translate-x-1/2 rounded-xl border border-border bg-popover px-3 py-2 text-left text-xs leading-5 text-popover-foreground shadow-sm"
                    style={{ left: bubble.left }}
                >
                    <span className="font-semibold">CaptionCat</span> · {t("bubble")}
                    <span className="mt-1 block font-medium text-primary">{t("cta")} →</span>
                    <span
                        aria-hidden="true"
                        className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border bg-popover"
                    />
                </div>
            )}
            <a
                href={href}
                target="_blank"
                rel="noopener"
                aria-label={t("label")}
                aria-describedby={bubble ? "captioncat-bubble" : undefined}
                onMouseEnter={showBubble}
                onMouseLeave={hideBubble}
                onFocus={showBubble}
                onBlur={hideBubble}
                onClick={handleClick}
                className="block cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <div ref={stageRef} className="relative h-16 overflow-hidden" aria-hidden="true">
                    <span className={`${LINE_CLASS} absolute inset-x-0 bottom-0 h-px bg-border text-[12px]`} />
                </div>
            </a>
        </div>
    );
}
