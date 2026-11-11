import { FLYOVER_FRAG } from "./shader";

const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const SPEED = 0.02;
// Steering only nudges the heading; the gull turns at most this fast (radians per second).
const TURN_RATE = 0.45;
// Largest canvas we render, in device pixels; keeps big screens cool.
const MAX_PIXELS = 2_000_000;
// Power saving: the scene moves slowly, so 30 fps is plenty. The canvas renders at a
// modest pixel ratio and is scaled up by CSS; the soft painted look hides the difference.
const FRAME_MS = 1000 / 30;
const MAX_DPR = { hero: 1.5, steer: 1 } as const;
// With no input for a while, slow the frame rate gradually to a near-still picture.
const IDLE_AFTER_MS = 5 * 60 * 1000;
const IDLE_RAMP_MS = 20 * 1000;
const IDLE_FRAME_MS = 250;
const GAP = 1.6;
// In "steer" mode one world unit is this many CSS pixels, so a larger canvas shows more land.
const UNIT_CSS = 560;

export type FlyoverState = {
    /** Signed distance from the gull to the nearest river, along the gull's right-hand side. */
    riverOffsetRight: number;
    /** Plain distance from the gull to the nearest river centre line. */
    riverDistance: number;
};

export type Flyover = {
    /** Point the gull toward a spot on the canvas (0..1 coordinates); it turns there gradually. */
    aimAt(x: number, y: number): void;
    /** Turn the gull's target heading by an angle in radians, for keyboard control. */
    turn(delta: number): void;
    setFeather(feather: boolean): void;
    /** Renders the current moment at a given pixel size and scale (pixels per world unit), feathered, as a 2D canvas. */
    snapshot(width: number, height: number, pxPerUnit: number): HTMLCanvasElement | null;
    state(): FlyoverState;
    destroy(): void;
};

// Mirrors riverX in the shader, including the repeat across the land.
function riverCentre(x: number, y: number): number {
    const k = Math.floor((x - 0.06) / GAP + 0.5);
    const v = y + k * 3.7;
    return k * GAP + 0.06 + 0.15 * Math.sin(v * 2.3) + 0.045 * Math.sin(v * 5.3 + 1.3);
}

const smoothstep = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Starts the painted-grassland flyover on a canvas. "hero" flies straight ahead with a
 * wandering gull; "steer" lets the viewer nudge the gull's heading. Returns null when
 * WebGL or the shader is unavailable, so the caller can show a fallback.
 */
export function startFlyover(
    canvas: HTMLCanvasElement,
    stage: HTMLElement,
    options: { feather: boolean; mode: "hero" | "steer" }
): Flyover | null {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;

    const compile = (type: number, src: string) => {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FLYOVER_FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uUnit = u("uUnit"), uRes = u("uRes"), uTime = u("uTime"), uScroll = u("uScroll"), uCamX = u("uCamX"),
        uFeather = u("uFeather"), uGull = u("uGull");

    let feather = options.feather;
    let t = 40 + Math.random() * 200;
    let last = performance.now();
    let raf = 0;
    let inView = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Camera position in world units, and the gull on screen (x across -0.5..0.5, y up, centred).
    let camX = 0;
    let camY = t * SPEED;
    let heading = 0; // radians clockwise from "up the screen"
    let targetHeading = 0;
    let turnSpeed = 0;
    const gull = { x: 0, y: -0.02, vx: 0, vy: 0, rot: 0, flapPhase: 0, flapAmt: 0 };

    const wander = (time: number, scale: number) => ({
        x: (0.035 * Math.sin(time * 0.11) + 0.015 * Math.sin(time * 0.37)) * scale,
        y: -0.02 + 0.025 * Math.sin(time * 0.09) * scale,
    });

    const step = (dt: number) => {
        t += dt;
        // The steered gull stays near the middle and drifts only a little.
        const goal = wander(t, options.mode === "steer" ? 0.35 : 1);
        const k = 1.2;
        gull.vx += ((goal.x - gull.x) * k * k - gull.vx * 2 * k) * dt;
        gull.vy += ((goal.y - gull.y) * k * k - gull.vy * 2 * k) * dt;
        gull.x += gull.vx * dt;
        gull.y += gull.vy * dt;

        let effort = Math.min(1, Math.hypot(gull.vx, gull.vy) * 9 + Math.max(0, gull.vy) * 12);
        if (options.mode === "steer") {
            const diff = wrapAngle(targetHeading - heading);
            const wanted = Math.max(-TURN_RATE, Math.min(TURN_RATE, diff * 0.8));
            turnSpeed += (wanted - turnSpeed) * Math.min(1, dt * 2);
            heading = wrapAngle(heading + turnSpeed * dt);
            camX += Math.sin(heading) * SPEED * dt;
            camY += Math.cos(heading) * SPEED * dt;
            effort = Math.max(effort, Math.min(1, Math.abs(turnSpeed) * 1.5));
        } else {
            camY += SPEED * dt;
        }
        // Lean into lateral drift and into turns; the shader rotates the gull by -rot.
        const lean = -gull.vx * 50 +(options.mode === "steer" ? -turnSpeed * 0.5 : 0);
        const rotGoal = -heading + Math.max(-0.6, Math.min(0.6, lean));
        gull.rot += wrapAngle(rotGoal - gull.rot) * Math.min(1, dt * 4);
        // Flap when working (drifting fast, climbing, turning), otherwise glide with lazy bursts.
        const lazy = smoothstep(0.1, 0.7, Math.sin(t * 0.45));
        gull.flapAmt += (Math.max(effort, lazy) - gull.flapAmt) * Math.min(1, dt * 3);
        gull.flapPhase += dt * (7 + effort * 3);
    };

    // Canvas pixels per world unit: the hero fits one unit to its width; the steer view keeps a fixed scale.
    const unit = () => (options.mode === "steer" ? UNIT_CSS * canvas.width / Math.max(1, stage.clientWidth) : canvas.width);

    const draw = (override?: { unit: number; feather: boolean }) => {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uUnit, override ? override.unit : unit());
        gl.uniform1f(uTime, t);
        gl.uniform1f(uScroll, camY);
        gl.uniform1f(uCamX, camX);
        gl.uniform1f(uFeather, (override ? override.feather : feather) ? 1 : 0);
        gl.uniform4f(uGull, gull.x, gull.y, gull.rot, Math.sin(gull.flapPhase) * 1.3 * gull.flapAmt);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const fit = () => {
        let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR[options.mode]);
        const cw = stage.clientWidth, ch = stage.clientHeight;
        if (cw * ch * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (cw * ch));
        const w = Math.round(cw * dpr), h = Math.round(ch * dpr);
        if (w && h && (canvas.width !== w || canvas.height !== h)) {
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
            if (!raf) draw();
        }
    };
    let lastActive = performance.now();
    const wake = () => {
        lastActive = performance.now();
    };
    const frameInterval = (ms: number) => {
        const idle = ms - lastActive - IDLE_AFTER_MS;
        if (idle <= 0) return FRAME_MS;
        return FRAME_MS + Math.min(1, idle / IDLE_RAMP_MS) * (IDLE_FRAME_MS - FRAME_MS);
    };
    const frame = (ms: number) => {
        raf = requestAnimationFrame(frame);
        // Skip display refreshes until the next frame is due (small slack for timer jitter).
        if (ms - last < frameInterval(ms) - 2) return;
        step(Math.min(0.3, (ms - last) / 1000));
        last = ms;
        draw();
    };
    const play = () => {
        if (raf || reduce || !inView || document.hidden) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
    };
    const pause = () => {
        cancelAnimationFrame(raf);
        raf = 0;
    };

    const start = wander(t, options.mode === "steer" ? 0.35 : 1);
    gull.x = start.x;
    gull.y = start.y;
    const resize = new ResizeObserver(fit);
    resize.observe(stage);
    fit();
    draw();
    const io = new IntersectionObserver((entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        if (inView) play();
        else pause();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);
    const activity = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;
    activity.forEach((type) => window.addEventListener(type, wake, { passive: true }));
    play();

    return {
        aimAt(x, y) {
            const scale = unit();
            const dx = (x - 0.5) * canvas.width / scale - gull.x;
            const dy = (0.5 - y) * canvas.height / scale - gull.y;
            // Ignore points right on top of the gull, where the direction is meaningless.
            if (Math.hypot(dx, dy) < 0.04) return;
            targetHeading = Math.atan2(dx, dy);
        },
        turn(delta) {
            targetHeading = wrapAngle(targetHeading + delta);
        },
        snapshot(width, height, pxPerUnit) {
            // Render at card size, copy it out in the same task (before the buffer clears), then restore.
            const w = canvas.width, h = canvas.height;
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
            draw({ unit: pxPerUnit, feather: true });
            const out = document.createElement("canvas");
            out.width = width;
            out.height = height;
            out.getContext("2d")?.drawImage(canvas, 0, 0);
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
            draw();
            return gl.isContextLost() ? null : out;
        },
        setFeather(value) {
            feather = value;
            if (!raf) draw();
        },
        state() {
            const gx = camX + gull.x, gy = camY + gull.y;
            const offset = riverCentre(gx, gy) - gx;
            return { riverOffsetRight: offset * Math.cos(heading), riverDistance: Math.abs(offset) };
        },
        destroy() {
            pause();
            resize.disconnect();
            io.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
            activity.forEach((type) => window.removeEventListener(type, wake));
            gl.deleteBuffer(buf);
            gl.deleteProgram(prog);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
        },
    };
}
