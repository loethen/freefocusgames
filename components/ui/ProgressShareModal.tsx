"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { Download, ImageIcon, Link2, Linkedin, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { XLogo } from "@/components/ui/XLogo";
import { ProgressCardData, renderProgressCardBlob } from "@/lib/progress-share";

type ProgressShareModalProps = {
    isOpen: boolean;
    onClose: () => void;
    card: ProgressCardData | null;
    fileName: string;
};

type ShareAction = {
    key: string;
    label: string;
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
};

function RedditLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286A.72.72 0 0 0 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199a1.999 1.999 0 1 1-1.947 2.46v.002a2.368 2.368 0 0 0-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363a2.802 2.802 0 1 1 2.908 4.753c-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87a2.8 2.8 0 0 1 1.189-5.34c.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01a3.229 3.229 0 0 1 2.88-3.207 2 2 0 0 1 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135a.222.222 0 0 0-.183.305 3.199 3.199 0 0 0 2.953 1.964 3.2 3.2 0 0 0 2.953-1.964.222.222 0 0 0-.184-.305 27.75 27.75 0 0 0-2.769-.135Z" />
        </svg>
    );
}

export function ProgressShareModal({
    isOpen,
    onClose,
    card,
    fileName,
}: ProgressShareModalProps) {
    const t = useTranslations("common.progressShare");
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationFailed, setGenerationFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    const canCopyImage = useMemo(() => {
        return typeof navigator !== "undefined"
            && !!navigator.clipboard
            && typeof navigator.clipboard.write === "function"
            && typeof ClipboardItem !== "undefined";
    }, []);


    useEffect(() => {
        if (!isOpen || !card) {
            return;
        }

        let isCancelled = false;
        let localPreviewUrl = "";

        setImageBlob(null);
        setPreviewUrl("");
        setGenerationFailed(false);
        setIsGenerating(true);
        void renderProgressCardBlob(card)
            .then((blob) => {
                if (isCancelled) {
                    return;
                }

                localPreviewUrl = URL.createObjectURL(blob);
                setImageBlob(blob);
                setPreviewUrl(localPreviewUrl);
            })
            .catch((error) => {
                console.error(error);
                if (!isCancelled) {
                    setGenerationFailed(true);
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsGenerating(false);
                }
            });

        return () => {
            isCancelled = true;
            if (localPreviewUrl) {
                URL.revokeObjectURL(localPreviewUrl);
            }
        };
    }, [card, isOpen, attempt]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    // The game page without query or hash, so shared links stay clean.
    const pageUrl = `${window.location.origin}${window.location.pathname}`;
    const shareText = card
        ? t("shareText", { title: card.title, value: card.primaryValue })
        : "";

    const openShareWindow = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(pageUrl);
            toast.success(t("linkCopied"));
        } catch (error) {
            console.error(error);
            toast.error(t("linkCopyFailed"));
        }
    };

    const handleDownload = () => {
        if (!imageBlob) {
            return;
        }

        const url = URL.createObjectURL(imageBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(t("downloaded"));
    };

    const handleCopyImage = async () => {
        if (!imageBlob || !canCopyImage) {
            return;
        }

        try {
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": imageBlob }),
            ]);
            toast.success(t("copied"));
        } catch (error) {
            console.error(error);
            toast.error(t("copyFailed"));
        }
    };


    const encodedUrl = encodeURIComponent(pageUrl);
    const encodedText = encodeURIComponent(shareText);
    const iconClass = "h-5 w-5";

    const actions: ShareAction[] = [
        {
            key: "copy-link",
            label: t("copyLink"),
            icon: <Link2 className={iconClass} />,
            onClick: handleCopyLink,
        },
        ...(canCopyImage
            ? [{
                key: "copy-image",
                label: t("copyImage"),
                icon: <ImageIcon className={iconClass} />,
                onClick: handleCopyImage,
                disabled: !imageBlob,
            }]
            : []),
        {
            key: "x",
            label: "X",
            icon: <XLogo className="h-4 w-4" />,
            onClick: () => openShareWindow(`https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}`),
        },
        {
            key: "linkedin",
            label: "LinkedIn",
            icon: <Linkedin className={iconClass} />,
            onClick: () => openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`),
        },
        {
            key: "reddit",
            label: "Reddit",
            icon: <RedditLogo className={iconClass} />,
            onClick: () => openShareWindow(`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`),
        },
        {
            key: "download",
            label: t("download"),
            icon: <Download className={iconClass} />,
            onClick: handleDownload,
            disabled: !imageBlob,
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-xl"
            onClick={onClose}
        >
            {/* Capped at the viewport height so the close button stays reachable; the body scrolls if it must. */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={t("title")}
                className="relative flex max-h-full w-full max-w-xl flex-col md:max-w-4xl overflow-hidden rounded-3xl border border-black/5 bg-background shadow-[0_24px_80px_-20px_rgba(0,0,0,0.25)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4">
                    <h3 className="text-base font-semibold">{t("title")}</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={onClose}
                        aria-label={t("close")}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="min-h-0 overflow-y-auto px-5 pb-6 md:grid md:grid-cols-[minmax(0,1fr)_190px] md:items-center md:gap-6 md:pb-5">
                    <div className="flex justify-center overflow-hidden rounded-2xl border border-border bg-muted/50">
                        {previewUrl && !isGenerating ? (
                            <Image
                                src={previewUrl}
                                alt={t("previewAlt")}
                                width={1200}
                                height={1500}
                                unoptimized
                                // Tall cards shrink to fit the screen; on phones they also leave room for the share row below.
                                className="h-auto max-h-[calc(100dvh-16rem)] md:max-h-[calc(100dvh-8rem)] w-auto max-w-full object-contain"
                            />
                        ) : generationFailed ? (
                            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
                                <p className="font-medium text-foreground">{t("createFailed")}</p>
                                <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
                                    {t("retry")}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p>{t("preparing")}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 flex flex-wrap justify-center gap-x-1 gap-y-4 md:mt-0 md:flex-col md:flex-nowrap md:gap-1">
                        {actions.map((action) => (
                            <button
                                key={action.key}
                                type="button"
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className="group flex w-[76px] flex-col items-center gap-2 rounded-xl text-xs text-foreground/80 transition-colors md:w-full md:flex-row md:gap-3 md:px-2 md:py-1.5 md:text-sm md:text-foreground md:hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors group-hover:bg-muted-foreground/15 md:h-10 md:w-10 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                                    {action.icon}
                                </span>
                                <span className="text-center leading-tight md:text-left">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
