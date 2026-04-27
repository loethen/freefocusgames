"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Download, ImageIcon, Loader2, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ProgressCardData, renderProgressCardBlob } from "@/lib/progress-share";

type ProgressShareModalProps = {
    isOpen: boolean;
    onClose: () => void;
    card: ProgressCardData | null;
    fileName: string;
};

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

    const canCopyImage = useMemo(() => {
        return typeof navigator !== "undefined"
            && !!navigator.clipboard
            && typeof navigator.clipboard.write === "function"
            && typeof ClipboardItem !== "undefined";
    }, []);

    const canShareImage = useMemo(() => {
        return typeof navigator !== "undefined"
            && typeof navigator.share === "function"
            && typeof File !== "undefined";
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
    }, [card, isOpen]);

    if (!isOpen) {
        return null;
    }

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

    const handleShareImage = async () => {
        if (!imageBlob || !card || !canShareImage) {
            return;
        }

        try {
            const file = new File([imageBlob], fileName, { type: "image/png" });
            if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
                throw new Error("Sharing files is not supported");
            }

            await navigator.share({
                title: card.title,
                text: card.trendText,
                files: [file],
            });
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }

            console.error(error);
            toast.error(t("shareFailed"));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold">{t("title")}</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="overflow-hidden rounded-[28px] bg-muted/30">
                        {isGenerating || !previewUrl ? (
                            generationFailed ? (
                                <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
                                    <p className="font-medium text-foreground">{t("createFailed")}</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setGenerationFailed(false);
                                            setImageBlob(null);
                                            setPreviewUrl("");
                                            setIsGenerating(true);
                                            void renderProgressCardBlob(card as ProgressCardData)
                                                .then((blob) => {
                                                    const nextPreviewUrl = URL.createObjectURL(blob);
                                                    setImageBlob(blob);
                                                    setPreviewUrl(nextPreviewUrl);
                                                })
                                                .catch((error) => {
                                                    console.error(error);
                                                    setGenerationFailed(true);
                                                })
                                                .finally(() => {
                                                    setIsGenerating(false);
                                                });
                                        }}
                                    >
                                        {t("retry")}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p>{t("preparing")}</p>
                                </div>
                            )
                        ) : (
                            <Image
                                src={previewUrl}
                                alt={t("previewAlt")}
                                width={1200}
                                height={1500}
                                unoptimized
                                className="h-auto w-full object-contain"
                            />
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            className="justify-start gap-2"
                            onClick={handleShareImage}
                            disabled={!imageBlob || !canShareImage}
                        >
                            <Share2 className="h-4 w-4" />
                            {t("shareImage")}
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={handleCopyImage}
                            disabled={!imageBlob || !canCopyImage}
                        >
                            <ImageIcon className="h-4 w-4" />
                            {t("copyImage")}
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={handleDownload}
                            disabled={!imageBlob}
                        >
                            <Download className="h-4 w-4" />
                            {t("downloadImage")}
                        </Button>

                        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                            <p>{t("note")}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
