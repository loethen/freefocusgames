// Start-line audio for the F1 reaction test: a synthesised beep per red light,
// a buzzer on a jump start, and a real F1 launch once the player presses.
//
// Lights out itself is silent, and the launch only follows the player's press,
// so the sound never tells the player when to press.
//
// The launch is a 2012 Red Bull Renault V8 leaving the start line at Sydney
// Motorsport Park, recorded by Ears68 and released as CC0:
// https://freesound.org/people/Ears68/sounds/181187/
// Trimmed to two seconds: from just before the clutch drop, fading out as the car gets away.
const LAUNCH_URL = '/sounds/f1-launch.mp3';
const LAUNCH_VOLUME = 0.85;

type AudioContextConstructor = typeof AudioContext;

function getAudioContextClass(): AudioContextConstructor | null {
    if (typeof window === 'undefined') return null;
    const w = window as Window & { webkitAudioContext?: AudioContextConstructor };
    return w.AudioContext ?? w.webkitAudioContext ?? null;
}

// Cancels pending automation and pins the parameter at its current value
function hold(param: AudioParam, at: number) {
    if (typeof param.cancelAndHoldAtTime === 'function') {
        param.cancelAndHoldAtTime(at);
    } else {
        param.cancelScheduledValues(at);
        param.setValueAtTime(param.value, at);
    }
}

export class F1Sound {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private launchBuffer: AudioBuffer | null = null;
    private launchLoading = false;
    private engine: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
    // Off until the player turns sound on
    private muted = true;

    setMuted(muted: boolean) {
        this.muted = muted;
        if (muted) this.stopEngines(0.08);
        if (this.master && this.ctx) {
            hold(this.master.gain, this.ctx.currentTime);
            this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.9, this.ctx.currentTime + 0.08);
        }
    }

    // Call from a user gesture: browsers only allow audio to start after one.
    unlock() {
        if (this.muted) return null;
        if (!this.ctx) {
            const AudioContextClass = getAudioContextClass();
            if (!AudioContextClass) return null;
            this.ctx = new AudioContextClass();
            const compressor = this.ctx.createDynamicsCompressor();
            compressor.threshold.value = -18;
            compressor.ratio.value = 6;
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.9;
            this.master.connect(compressor).connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') void this.ctx.resume();
        this.loadLaunch(this.ctx);
        return this.ctx;
    }

    // Fetched on the first tap; the five lights give it seconds to arrive before it's needed
    private loadLaunch(ctx: AudioContext) {
        if (this.launchBuffer || this.launchLoading) return;
        this.launchLoading = true;
        fetch(LAUNCH_URL)
            .then((response) => {
                if (!response.ok) throw new Error(`Launch sound failed to load: ${response.status}`);
                return response.arrayBuffer();
            })
            .then((data) => ctx.decodeAudioData(data))
            .then((buffer) => {
                this.launchBuffer = buffer;
            })
            .catch((error) => {
                // The game works silently without it; a later tap tries again
                console.error(error);
            })
            .finally(() => {
                this.launchLoading = false;
            });
    }

    // Short start-light beep, slightly higher for each light
    light(index: number) {
        const ctx = this.unlock();
        if (!ctx || !this.master) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 760 + index * 12;
        filter.type = 'lowpass';
        filter.frequency.value = 2400;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.008);
        gain.gain.setValueAtTime(0.16, now + 0.11);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(filter).connect(gain).connect(this.master);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // The player has launched: play the real F1 start from the clutch drop
    launch() {
        const ctx = this.unlock();
        if (!ctx || !this.master || !this.launchBuffer) return;
        this.stopEngines(0.05);
        const source = ctx.createBufferSource();
        source.buffer = this.launchBuffer;
        const gain = ctx.createGain();
        gain.gain.value = LAUNCH_VOLUME;
        source.connect(gain).connect(this.master);
        const engine = { source, gain };
        source.onended = () => {
            if (this.engine === engine) this.engine = null;
        };
        source.start();
        this.engine = engine;
    }

    // Jump start: a warning buzzer and the engine cut
    jumpStart() {
        const ctx = this.unlock();
        if (!ctx || !this.master) return;
        this.stopEngines(0.25);
        const now = ctx.currentTime;
        [0, 0.22].forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 196;
            gain.gain.setValueAtTime(0, now + offset);
            gain.gain.linearRampToValueAtTime(0.14, now + offset + 0.01);
            gain.gain.setValueAtTime(0.14, now + offset + 0.16);
            gain.gain.linearRampToValueAtTime(0, now + offset + 0.19);
            osc.connect(gain).connect(this.master as GainNode);
            osc.start(now + offset);
            osc.stop(now + offset + 0.2);
        });
    }

    // Fades out a launch that is still playing, over `fade` seconds
    stopEngines(fade = 0.2) {
        const ctx = this.ctx;
        const engine = this.engine;
        this.engine = null;
        if (!ctx || !engine) return;
        const now = ctx.currentTime;
        hold(engine.gain.gain, now);
        engine.gain.gain.linearRampToValueAtTime(0, now + fade);
        engine.source.stop(now + fade + 0.05);
    }

    dispose() {
        this.stopEngines(0.05);
        if (this.ctx) void this.ctx.close();
        this.ctx = null;
        this.master = null;
    }
}
