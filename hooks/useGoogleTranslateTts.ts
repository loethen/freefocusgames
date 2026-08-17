"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TtsStatus = "idle" | "loading" | "playing" | "error";

export function buildTtsProxyUrl(text: string): string {
  const params = new URLSearchParams({ q: text });
  return `/api/tts?${params.toString()}`;
}

export function splitTtsText(text: string, maxLength = 180): string[] {
  const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [text];
  const chunks: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length <= maxLength) {
      chunks.push(sentence);
      continue;
    }

    const words = sentence.split(/\s+/);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxLength && current) {
        chunks.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks;
}

export function useGoogleTranslateTts() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishCurrentRef = useRef<(() => void) | null>(null);
  const playbackTokenRef = useRef(0);
  const lastTextRef = useRef("");
  const [status, setStatus] = useState<TtsStatus>("idle");

  const stop = useCallback(() => {
    playbackTokenRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    finishCurrentRef.current?.();
    finishCurrentRef.current = null;
    setStatus("idle");
  }, []);

  const play = useCallback(async (text: string) => {
    if (!text.trim()) return;

    playbackTokenRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    finishCurrentRef.current?.();

    lastTextRef.current = text;
    const token = playbackTokenRef.current;
    const chunks = splitTtsText(text);
    setStatus("loading");

    try {
      for (const chunk of chunks) {
        if (token !== playbackTokenRef.current) return;
        const audio = new Audio(buildTtsProxyUrl(chunk));
        audio.preload = "auto";
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          finishCurrentRef.current = resolve;
          audio.onplaying = () => setStatus("playing");
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("TTS audio failed"));
          void audio.play().catch(reject);
        });
      }

      if (token === playbackTokenRef.current) {
        audioRef.current = null;
        finishCurrentRef.current = null;
        setStatus("idle");
      }
    } catch {
      if (token === playbackTokenRef.current) setStatus("error");
    }
  }, []);

  const replay = useCallback(async () => {
    if (lastTextRef.current) {
      await play(lastTextRef.current);
    }
  }, [play]);

  useEffect(() => stop, [stop]);

  return { play, replay, stop, status };
}
