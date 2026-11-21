// Generative focus sound for the grassland flyover: wind, a brook and deep brown noise.
// Synthesised with Web Audio using equal-power crossfaded noise buffers, paired with a
// silent HTML5 audio keep-alive and Media Session integration so playback continues
// seamlessly across background tabs and mobile lock screens.

export type SoundLayer = "wind" | "stream" | "deep";

export type FocusSoundOptions = {
    metadata?: {
        title: string;
        artist?: string;
        album?: string;
        artwork?: string;
    };
    onPlayingChange?: (playing: boolean) => void;
};

export type FocusSound = {
    readonly playing: boolean;
    start(): Promise<void>;
    stop(): void;
    setLevel(layer: SoundLayer, value: number): void;
    /** How close the river is (0..1) and which side it is on (-1 left .. 1 right). */
    setRiver(proximity: number, pan: number): void;
    dispose(): void;
};

type NoiseKind = "white" | "pink" | "brown";

type NavigatorWithAudioSession = Navigator & {
    audioSession?: {
        type: "auto" | "playback" | "transient" | "transient-solo" | "ambient" | "play-and-record";
    };
};

/**
 * Creates a tiny valid 1-second silent 8-bit PCM WAV Blob URL.
 * Playing this looped HTML5 <audio> alongside Web Audio keeps mobile browsers
 * (including iOS Safari with the hardware mute switch enabled and screen locked)
 * in active media-playback mode and exposes lock-screen Media Session controls.
 */
function createSilentWavUrl(): string {
    const sampleRate = 8000;
    const numSamples = sampleRate; // 1 second
    const dataSize = numSamples; // 8-bit mono = 1 byte/sample
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true); // byte rate
    view.setUint16(32, 1, true); // block align
    view.setUint16(34, 8, true); // bits per sample
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);
    // 0x80 is exact digital silence for unsigned 8-bit PCM.
    new Uint8Array(buffer, 44).fill(0x80);

    return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

export function createFocusSound(
    initial: Record<SoundLayer, number>,
    options: FocusSoundOptions = {}
): FocusSound {
    let ctx: AudioContext | null = null;
    let master: GainNode;
    const layerGain = {} as Record<SoundLayer, GainNode>;
    let streamPan: StereoPannerNode;
    let streamNear: GainNode;
    const levels = { ...initial };
    let playing = false;
    let disposed = false;
    let bubbleTimer = 0;
    let suspendTimer = 0;
    let keepAliveAudio: HTMLAudioElement | null = null;
    let silentWavUrl: string | null = null;
    let internalAudioToggle = false;
    let listenersBound = false;

    function notifyPlaying(next: boolean) {
        if (playing === next) return;
        playing = next;
        options.onPlayingChange?.(next);
    }

    function configureAudioSession() {
        if (typeof navigator === "undefined") return;
        const nav = navigator as NavigatorWithAudioSession;
        if (nav.audioSession) {
            try {
                nav.audioSession.type = "playback";
            } catch {
                // Ignore if browser rejects setting audioSession.type.
            }
        }
    }

    function ensureKeepAliveAudio(): HTMLAudioElement | null {
        if (typeof window === "undefined" || typeof Audio === "undefined") return null;
        if (keepAliveAudio) return keepAliveAudio;

        silentWavUrl = createSilentWavUrl();
        const audio = new Audio(silentWavUrl);
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = 0.01;
        audio.setAttribute("playsinline", "");
        audio.setAttribute("webkit-playsinline", "");
        audio.setAttribute("aria-hidden", "true");

        audio.addEventListener("pause", () => {
            if (internalAudioToggle || disposed) return;
            // User paused from OS lock screen or notification shade.
            if (playing) stopInternal(false);
        });

        audio.addEventListener("play", () => {
            if (internalAudioToggle || disposed) return;
            // User resumed from OS lock screen or headphones.
            if (!playing) void startInternal();
        });

        keepAliveAudio = audio;
        return audio;
    }

    function updateMediaSession(state: "playing" | "paused" | "none") {
        if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
        const ms = navigator.mediaSession;
        try {
            if (state === "none") {
                ms.playbackState = "none";
                ms.setActionHandler("play", null);
                ms.setActionHandler("pause", null);
                ms.setActionHandler("stop", null);
                return;
            }
            if (typeof MediaMetadata !== "undefined" && options.metadata) {
                const artworkUrl = options.metadata.artwork
                    ? new URL(options.metadata.artwork, window.location.origin).toString()
                    : undefined;
                ms.metadata = new MediaMetadata({
                    title: options.metadata.title,
                    artist: options.metadata.artist ?? "Free Focus Games",
                    album: options.metadata.album ?? "Focus Ambient Audio",
                    artwork: artworkUrl
                        ? [{ src: artworkUrl, sizes: "1200x675", type: "image/png" }]
                        : [],
                });
            }
            ms.playbackState = state;
            ms.setActionHandler("play", () => {
                void startInternal();
            });
            ms.setActionHandler("pause", () => {
                stopInternal(true);
            });
            ms.setActionHandler("stop", () => {
                stopInternal(true);
            });
        } catch {
            // Media Session API may restrict certain handlers on older browsers.
        }
    }

    function attemptResumeIfPlaying() {
        if (!playing || disposed || !ctx) return;
        if (ctx.state !== "running") {
            void ctx.resume().catch(() => {
                // Retry automatically on next state/visibility event.
            });
        }
        if (keepAliveAudio && keepAliveAudio.paused) {
            internalAudioToggle = true;
            void keepAliveAudio.play().catch(() => {}).finally(() => {
                internalAudioToggle = false;
            });
        }
    }

    function onVisibilityChange() {
        if (!playing || disposed) return;
        // Re-assert audio playback when transitioning between foreground and background.
        attemptResumeIfPlaying();
    }

    function bindLifecycleListeners() {
        if (listenersBound || typeof document === "undefined") return;
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pageshow", onVisibilityChange);
        listenersBound = true;
    }

    function unbindLifecycleListeners() {
        if (!listenersBound || typeof document === "undefined") return;
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("pageshow", onVisibilityChange);
        listenersBound = false;
    }

    /**
     * Generates a stereo noise buffer with equal-power crossfading at the loop boundary
     * so white, pink, and brown noise loop indefinitely without clicks or audible seams.
     */
    function noise(ac: AudioContext, seconds: number, kind: NoiseKind) {
        const n = Math.floor(ac.sampleRate * seconds);
        const fade = Math.min(Math.floor(ac.sampleRate * 0.35), Math.floor(n / 4));
        const total = n + fade;
        const buffer = ac.createBuffer(2, n, ac.sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const raw = new Float32Array(total);
            let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            let sum = 0;

            for (let i = 0; i < total; i++) {
                const w = Math.random() * 2 - 1;
                let sample: number;
                if (kind === "brown") {
                    last = (last + 0.02 * w) / 1.02;
                    sample = last * 3.5;
                } else if (kind === "pink") {
                    b0 = 0.99886 * b0 + w * 0.0555179;
                    b1 = 0.99332 * b1 + w * 0.0750759;
                    b2 = 0.969 * b2 + w * 0.153852;
                    b3 = 0.8665 * b3 + w * 0.3104856;
                    b4 = 0.55 * b4 + w * 0.5329522;
                    b5 = -0.7616 * b5 - w * 0.016898;
                    sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
                    b6 = w * 0.115926;
                } else {
                    sample = w;
                }
                raw[i] = sample;
                sum += sample;
            }

            // Remove DC offset and brown-noise endpoint drift before crossfading.
            const mean = sum / total;
            const drift = kind === "brown" ? raw[total - 1] - raw[0] : 0;
            for (let i = 0; i < total; i++) {
                raw[i] -= mean + (drift * i) / (total - 1);
            }

            const d = buffer.getChannelData(ch);
            for (let i = 0; i < fade; i++) {
                const t = i / fade;
                const fadeIn = Math.sin(t * Math.PI * 0.5);
                const fadeOut = Math.cos(t * Math.PI * 0.5);
                d[i] = raw[i] * fadeIn + raw[n + i] * fadeOut;
            }
            d.set(raw.subarray(fade, n), fade);
        }
        return buffer;
    }

    function chain(ac: AudioContext, buffer: AudioBuffer, nodes: AudioNode[]) {
        const src = ac.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        let cur: AudioNode = src;
        for (const node of nodes) {
            cur.connect(node);
            cur = node;
        }
        src.start();
    }

    function lfo(ac: AudioContext, freq: number, depth: number, param: AudioParam) {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.frequency.value = freq;
        g.gain.value = depth;
        o.connect(g);
        g.connect(param);
        o.start();
    }

    function init() {
        const AC =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ac = new AC({ latencyHint: "playback" });
        ctx = ac;
        ac.onstatechange = () => {
            if (playing && !disposed && ac.state !== "running") {
                void ac.resume().catch(() => {});
            }
        };

        master = ac.createGain();
        master.gain.value = 0;
        const comp = ac.createDynamicsCompressor();
        master.connect(comp);
        comp.connect(ac.destination);

        for (const layer of ["wind", "stream", "deep"] as SoundLayer[]) {
            layerGain[layer] = ac.createGain();
            layerGain[layer].gain.value = levels[layer];
        }

        // Wind: pink noise through a wandering low-pass, with slow gusts.
        const windLP = ac.createBiquadFilter();
        windLP.type = "lowpass";
        windLP.frequency.value = 700;
        windLP.Q.value = 0.7;
        const gust = ac.createGain();
        gust.gain.value = 0.32;
        lfo(ac, 0.071, 0.12, gust.gain);
        lfo(ac, 0.113, 0.08, gust.gain);
        lfo(ac, 0.05, 260, windLP.frequency);
        chain(ac, noise(ac, 11, "pink"), [windLP, gust, layerGain.wind, master]);

        // Brook: two bands of noise plus scattered bubble chirps, panned toward the river.
        streamPan = ac.createStereoPanner();
        streamNear = ac.createGain();
        streamNear.gain.value = 0.7;
        streamNear.connect(streamPan);
        streamPan.connect(layerGain.stream);
        layerGain.stream.connect(master);
        const bands: [number, number, number][] = [[900, 0.9, 0.22], [2600, 1.6, 0.1]];
        for (const [f, q, g] of bands) {
            const bp = ac.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.value = f;
            bp.Q.value = q;
            lfo(ac, 0.17 + Math.random() * 0.1, f * 0.18, bp.frequency);
            const gn = ac.createGain();
            gn.gain.value = g;
            chain(ac, noise(ac, 9, "white"), [bp, gn, streamNear]);
        }

        // Deep: brown noise, the classic steady focus bed.
        const deepLP = ac.createBiquadFilter();
        deepLP.type = "lowpass";
        deepLP.frequency.value = 420;
        const deepG = ac.createGain();
        deepG.gain.value = 0.55;
        chain(ac, noise(ac, 13, "brown"), [deepLP, deepG, layerGain.deep, master]);
    }

    function bubble() {
        if (!ctx || !playing || ctx.state !== "running") return;
        const at = ctx.currentTime + 0.02;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f0 = 350 + Math.random() * 900;
        o.frequency.setValueAtTime(f0, at);
        o.frequency.exponentialRampToValueAtTime(f0 * (1.6 + Math.random()), at + 0.05);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(0.012 + Math.random() * 0.02, at + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
        o.connect(g);
        g.connect(streamNear);
        o.start(at);
        o.stop(at + 0.08);
    }

    function scheduleBubbles() {
        window.clearTimeout(bubbleTimer);
        if (!playing || disposed) return;
        const burst = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < burst; i++) bubble();
        bubbleTimer = window.setTimeout(scheduleBubbles, 40 + Math.random() * 160);
    }

    async function startInternal() {
        if (disposed) return;
        configureAudioSession();
        bindLifecycleListeners();
        if (!ctx) init();
        const ac = ctx as AudioContext;
        window.clearTimeout(suspendTimer);

        // Start the silent HTML5 keep-alive synchronously inside the user gesture so mobile
        // Safari/Chrome promotes this tab to an active background/lock-screen media session.
        const audio = ensureKeepAliveAudio();
        let keepAlivePromise: Promise<void> | undefined;
        if (audio && audio.paused) {
            internalAudioToggle = true;
            keepAlivePromise = audio
                .play()
                .catch(() => {})
                .finally(() => {
                    internalAudioToggle = false;
                });
        }

        await ac.resume();
        if (keepAlivePromise) await keepAlivePromise;
        if (disposed) return;

        notifyPlaying(true);
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setTargetAtTime(0.9, ac.currentTime, 0.8);
        updateMediaSession("playing");
        scheduleBubbles();
    }

    function stopInternal(pauseKeepAlive: boolean) {
        if (!ctx) return;
        const ac = ctx;
        notifyPlaying(false);
        window.clearTimeout(bubbleTimer);
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setTargetAtTime(0, ac.currentTime, 0.25);

        if (pauseKeepAlive && keepAliveAudio && !keepAliveAudio.paused) {
            internalAudioToggle = true;
            keepAliveAudio.pause();
            internalAudioToggle = false;
        }
        updateMediaSession("paused");

        suspendTimer = window.setTimeout(() => {
            if (!playing && !disposed) void ac.suspend();
        }, 1200);
    }

    return {
        get playing() {
            return playing;
        },
        async start() {
            await startInternal();
        },
        stop() {
            stopInternal(true);
        },
        setLevel(layer, value) {
            levels[layer] = value;
            if (ctx) layerGain[layer].gain.setTargetAtTime(value, ctx.currentTime, 0.15);
        },
        setRiver(proximity, pan) {
            if (!ctx) return;
            streamNear.gain.setTargetAtTime(0.35 + 0.65 * proximity, ctx.currentTime, 0.4);
            streamPan.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, pan)), ctx.currentTime, 0.4);
        },
        dispose() {
            disposed = true;
            playing = false;
            window.clearTimeout(bubbleTimer);
            window.clearTimeout(suspendTimer);
            unbindLifecycleListeners();
            updateMediaSession("none");
            if (keepAliveAudio) {
                internalAudioToggle = true;
                keepAliveAudio.pause();
                keepAliveAudio.src = "";
                keepAliveAudio = null;
                internalAudioToggle = false;
            }
            if (silentWavUrl) {
                URL.revokeObjectURL(silentWavUrl);
                silentWavUrl = null;
            }
            void ctx?.close();
            ctx = null;
        },
    };
}
