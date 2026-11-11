// Share card for the white noise page: the current view of the grassland, feathered
// into white, with the page title, a line of description and the listener's mix.

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
export const CARD_SCENE_HEIGHT = 900;
// Pixels per world unit in the card's scene; a little wider than the homepage view.
export const CARD_SCENE_SCALE = 760;

export type FlyoverCardText = {
    title: string;
    subtitle: string;
    mixLabel: string;
    mix: string;
    url: string;
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
    // Split on spaces where there are any; otherwise (Chinese, Japanese) by character.
    const words = text.includes(" ") ? text.split(" ") : Array.from(text);
    const joiner = text.includes(" ") ? " " : "";
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
        const next = line ? line + joiner + word : word;
        if (ctx.measureText(next).width > maxWidth && line) {
            lines.push(line);
            line = word;
            if (lines.length === maxLines) break;
        } else {
            line = next;
        }
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length === maxLines && lines.join(joiner).length < text.length) {
        let last = lines[maxLines - 1];
        while (last && ctx.measureText(last + "…").width > maxWidth) last = last.slice(0, -1);
        lines[maxLines - 1] = last + "…";
    }
    return lines;
}

export function renderFlyoverCard(scene: HTMLCanvasElement, text: FlyoverCardText): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.reject(new Error("Canvas context not available"));

    const family = getComputedStyle(document.body).fontFamily || "ui-sans-serif, system-ui, sans-serif";
    const left = 96;
    const right = CARD_WIDTH - 96;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.drawImage(scene, 0, 40, CARD_WIDTH, CARD_SCENE_HEIGHT);

    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#0f172a";
    ctx.font = `600 64px ${family}`;
    ctx.fillText(wrap(ctx, text.title, right - left, 1)[0] ?? "", left, 1028);

    ctx.fillStyle = "#64748b";
    ctx.font = `400 32px ${family}`;
    wrap(ctx, text.subtitle, right - left, 2).forEach((line, i) => ctx.fillText(line, left, 1086 + i * 46));

    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(left, 1182, right - left, 2);

    ctx.fillStyle = "#94a3b8";
    ctx.font = `600 22px ${family}`;
    ctx.fillText(text.mixLabel.toUpperCase(), left, 1240);

    ctx.fillStyle = "#334155";
    ctx.font = `500 30px ${family}`;
    ctx.fillText(wrap(ctx, text.mix, right - left, 1)[0] ?? "", left, 1288);

    ctx.fillStyle = "#059669";
    ctx.font = `600 24px ${family}`;
    ctx.textAlign = "right";
    ctx.fillText(text.url, right, 1240);
    ctx.textAlign = "left";

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the card"))), "image/png");
    });
}
