// Generative focus sound for the grassland flyover: wind, a brook and deep brown noise.
// Everything is synthesised with Web Audio, so it never loops audibly and needs no files.

export type SoundLayer = "wind" | "stream" | "deep";

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

export function createFocusSound(initial: Record<SoundLayer, number>): FocusSound {
    let ctx: AudioContext | null = null;
    let master: GainNode;
    const layerGain = {} as Record<SoundLayer, GainNode>;
    let streamPan: StereoPannerNode;
    let streamNear: GainNode;
    const levels = { ...initial };
    let playing = false;
    let bubbleTimer = 0;
    let suspendTimer = 0;

    function noise(ac: AudioContext, seconds: number, kind: NoiseKind) {
        const n = Math.floor(ac.sampleRate * seconds);
        const buffer = ac.createBuffer(2, n, ac.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buffer.getChannelData(ch);
            let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < n; i++) {
                const w = Math.random() * 2 - 1;
                if (kind === "brown") {
                    last = (last + 0.02 * w) / 1.02;
                    d[i] = last * 3.5;
                } else if (kind === "pink") {
                    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
                    b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
                    b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
                    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
                    b6 = w * 0.115926;
                } else {
                    d[i] = w;
                }
            }
            if (kind === "brown") {
                // Remove drift so the loop point does not click.
                const drift = d[n - 1] - d[0];
                for (let i = 0; i < n; i++) d[i] -= (drift * i) / (n - 1);
            }
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
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ac = new AC();
        ctx = ac;
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
        chain(ac, noise(ac, 9, "pink"), [windLP, gust, layerGain.wind, master]);

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
            chain(ac, noise(ac, 7, "white"), [bp, gn, streamNear]);
        }

        // Deep: brown noise, the classic steady focus bed.
        const deepLP = ac.createBiquadFilter();
        deepLP.type = "lowpass";
        deepLP.frequency.value = 420;
        const deepG = ac.createGain();
        deepG.gain.value = 0.55;
        chain(ac, noise(ac, 11, "brown"), [deepLP, deepG, layerGain.deep, master]);
    }

    function bubble() {
        if (!ctx || !playing) return;
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
        if (!playing) return;
        const burst = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < burst; i++) bubble();
        bubbleTimer = window.setTimeout(scheduleBubbles, 40 + Math.random() * 160);
    }

    return {
        get playing() {
            return playing;
        },
        async start() {
            if (!ctx) init();
            const ac = ctx as AudioContext;
            window.clearTimeout(suspendTimer);
            await ac.resume();
            playing = true;
            master.gain.cancelScheduledValues(ac.currentTime);
            master.gain.setTargetAtTime(0.9, ac.currentTime, 0.8);
            scheduleBubbles();
        },
        stop() {
            if (!ctx) return;
            const ac = ctx;
            playing = false;
            window.clearTimeout(bubbleTimer);
            master.gain.setTargetAtTime(0, ac.currentTime, 0.25);
            suspendTimer = window.setTimeout(() => {
                if (!playing) void ac.suspend();
            }, 1200);
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
            playing = false;
            window.clearTimeout(bubbleTimer);
            window.clearTimeout(suspendTimer);
            void ctx?.close();
            ctx = null;
        },
    };
}
