export type ProgressDirection = "higher" | "lower";

export type ProgressHistoryEntry = {
    recordedAt: string;
    primaryValue: number;
};

export type ProgressCardMetric = {
    label: string;
    value: string;
};

export type ProgressCardTheme = {
    backgroundFrom: string;
    backgroundTo: string;
    accent: string;
    panel: string;
    text: string;
    mutedText: string;
};

export type ProgressCardData = {
    variant?: "progress" | "score";
    title: string;
    subtitle: string;
    primaryLabel: string;
    primaryValue: string;
    trendText: string;
    historyLabel: string;
    history: number[];
    direction: ProgressDirection;
    metrics: ProgressCardMetric[];
    footer: string;
    siteUrl?: string;
    theme: ProgressCardTheme;
};

type ProgressInsights = {
    previous: ProgressHistoryEntry | null;
    best: ProgressHistoryEntry | null;
    sessions: number;
    deltaFromPrevious: number | null;
    isImprovement: boolean | null;
};

const STORAGE_PREFIX = "freefocusgames.progress-history";
const MAX_HISTORY_ENTRIES = 8;

function getStorageKey(key: string) {
    return `${STORAGE_PREFIX}.${key}`;
}

function safeHistoryParse(rawValue: string | null): ProgressHistoryEntry[] {
    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue) as ProgressHistoryEntry[];
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter((entry) => (
            typeof entry?.recordedAt === "string" &&
            typeof entry?.primaryValue === "number" &&
            Number.isFinite(entry.primaryValue)
        ));
    } catch {
        return [];
    }
}

export function getProgressHistory(key: string) {
    if (typeof window === "undefined") {
        return [] as ProgressHistoryEntry[];
    }

    return safeHistoryParse(window.localStorage.getItem(getStorageKey(key)));
}

export function recordProgressSnapshot(key: string, primaryValue: number) {
    const nextEntry: ProgressHistoryEntry = {
        recordedAt: new Date().toISOString(),
        primaryValue,
    };

    if (typeof window === "undefined") {
        return [nextEntry];
    }

    const nextHistory = [...getProgressHistory(key), nextEntry].slice(-MAX_HISTORY_ENTRIES);
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(nextHistory));
    return nextHistory;
}

export function getProgressInsights(
    history: ProgressHistoryEntry[],
    direction: ProgressDirection
): ProgressInsights {
    const sessions = history.length;
    const current = history[sessions - 1] ?? null;
    const previous = sessions > 1 ? history[sessions - 2] : null;

    if (!current) {
        return {
            previous: null,
            best: null,
            sessions: 0,
            deltaFromPrevious: null,
            isImprovement: null,
        };
    }

    const best = history.reduce<ProgressHistoryEntry>((leader, entry) => {
        if (direction === "higher") {
            return entry.primaryValue > leader.primaryValue ? entry : leader;
        }

        return entry.primaryValue < leader.primaryValue ? entry : leader;
    }, history[0]);

    const deltaFromPrevious = previous
        ? Math.abs(current.primaryValue - previous.primaryValue)
        : null;

    const isImprovement = previous
        ? direction === "higher"
            ? current.primaryValue > previous.primaryValue
            : current.primaryValue < previous.primaryValue
        : null;

    return {
        previous,
        best,
        sessions,
        deltaFromPrevious,
        isImprovement,
    };
}

function dataUrlToBlob(dataUrl: string) {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mimeType = mimeMatch?.[1] ?? "image/png";
    const binary = atob(base64 ?? "");
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mimeType });
}

function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function fillRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillStyle: string
) {
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

function strokeRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    strokeStyle: string,
    lineWidth = 1
) {
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

function drawSparkline(
    ctx: CanvasRenderingContext2D,
    history: number[],
    direction: ProgressDirection,
    x: number,
    y: number,
    width: number,
    height: number,
    strokeColor: string,
    fillColor: string
) {
    if (history.length === 0) {
        return;
    }

    const values = history.slice(-8);
    const normalizedValues = direction === "lower"
        ? values.map((value) => -value)
        : values;
    const min = Math.min(...normalizedValues);
    const max = Math.max(...normalizedValues);
    const range = max - min || 1;
    const stepX = values.length > 1 ? width / (values.length - 1) : width / 2;

    const points = normalizedValues.map((value, index) => {
        const ratio = (value - min) / range;
        return {
            x: x + (values.length > 1 ? index * stepX : width / 2),
            y: y + height - ratio * height,
        };
    });

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, y + height);
    points.forEach((point, index) => {
        if (index === 0) {
            ctx.lineTo(point.x, point.y);
            return;
        }

        const previousPoint = points[index - 1];
        const midX = (previousPoint.x + point.x) / 2;
        ctx.quadraticCurveTo(midX, previousPoint.y, point.x, point.y);
    });
    ctx.lineTo(points[points.length - 1].x, y + height);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
            return;
        }

        const previousPoint = points[index - 1];
        const midX = (previousPoint.x + point.x) / 2;
        ctx.quadraticCurveTo(midX, previousPoint.y, point.x, point.y);
    });
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 5;
    ctx.stroke();

    points.forEach((point, index) => {
        const isLatest = index === points.length - 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, isLatest ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isLatest ? strokeColor : "rgba(255,255,255,0.9)";
        ctx.fill();
    });
    ctx.restore();
}

function drawCardFooter(ctx: CanvasRenderingContext2D, data: ProgressCardData) {
    const footerFontSize = data.footer.length > 36 ? 22 : 28;
    ctx.font = `600 ${footerFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = data.theme.text;
    ctx.fillText(data.footer, 110, 1328);
    const siteUrl = data.siteUrl ?? "freefocusgames.com";
    const siteFontSize = siteUrl.length > 42 ? 20 : 22;
    ctx.font = `500 ${siteFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = data.theme.mutedText;
    ctx.fillText(siteUrl, 110, 1372);
}

function wrapCanvasText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
) {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(nextLine).width <= maxWidth) {
            currentLine = nextLine;
            return;
        }

        if (currentLine) {
            lines.push(currentLine);
        }
        currentLine = word;
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.slice(0, 3);
}

function drawScoreCard(ctx: CanvasRenderingContext2D, data: ProgressCardData) {
    fillRoundedRect(ctx, 110, 110, 290, 54, 27, "rgba(255,255,255,0.14)");
    ctx.fillStyle = data.theme.text;
    ctx.font = "600 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(data.subtitle, 138, 145);

    const titleFontSize = data.title.length > 26 ? 54 : 62;
    ctx.font = `700 ${titleFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = data.theme.text;
    ctx.fillText(data.title, 110, 255);

    fillRoundedRect(ctx, 110, 320, 980, 390, 36, "rgba(255,255,255,0.11)");
    strokeRoundedRect(ctx, 110, 320, 980, 390, 36, "rgba(255,255,255,0.14)", 2);

    ctx.textAlign = "center";
    ctx.font = "700 30px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = data.theme.mutedText;
    ctx.fillText(data.primaryLabel, 600, 395);

    const primaryFontSize = data.primaryValue.length > 10 ? 118 : 138;
    ctx.font = `800 ${primaryFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = data.theme.text;
    ctx.fillText(data.primaryValue, 600, 555);

    fillRoundedRect(ctx, 180, 610, 840, 66, 24, "rgba(255,255,255,0.12)");
    const trendFontSize = data.trendText.length > 42 ? 24 : 28;
    ctx.font = `700 ${trendFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = data.theme.text;
    ctx.fillText(data.trendText, 600, 653);
    ctx.textAlign = "start";

    const metricY = 760;
    const cardWidth = 300;
    const gap = 30;
    data.metrics.slice(0, 3).forEach((metric, index) => {
        const x = 110 + index * (cardWidth + gap);
        fillRoundedRect(ctx, x, metricY, cardWidth, 190, 28, "rgba(255,255,255,0.10)");
        ctx.font = "600 22px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = data.theme.mutedText;
        ctx.fillText(metric.label, x + 28, metricY + 54);

        const valueFontSize = metric.value.length > 16 ? 34 : 42;
        ctx.font = `700 ${valueFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = data.theme.text;
        ctx.fillText(metric.value, x + 28, metricY + 122);
    });

    fillRoundedRect(ctx, 110, 1010, 980, 210, 30, "rgba(10,15,28,0.18)");
    ctx.font = "700 34px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = data.theme.text;
    const ruleLines = wrapCanvasText(ctx, data.historyLabel, 870);
    ruleLines.forEach((line, index) => {
        ctx.fillText(line, 150, 1085 + index * 48);
    });

    drawCardFooter(ctx, data);
}

export async function renderProgressCardBlob(data: ProgressCardData) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1500;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Canvas context not available");
    }

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, data.theme.backgroundFrom);
    gradient.addColorStop(1, data.theme.backgroundTo);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = data.theme.accent;
    ctx.beginPath();
    ctx.arc(980, 210, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(180, 1250, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    fillRoundedRect(ctx, 60, 60, 1080, 1380, 42, data.theme.panel);
    strokeRoundedRect(ctx, 60, 60, 1080, 1380, 42, "rgba(255,255,255,0.12)", 2);

    if (data.variant === "score") {
        drawScoreCard(ctx, data);
        try {
            const dataUrl = canvas.toDataURL("image/png");
            return dataUrlToBlob(dataUrl);
        } catch (error) {
            throw error instanceof Error ? error : new Error("Failed to create PNG data URL");
        }
    }

    fillRoundedRect(ctx, 110, 110, 260, 54, 27, "rgba(255,255,255,0.14)");
    ctx.fillStyle = data.theme.text;
    ctx.font = "600 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(data.subtitle, 138, 145);

    const titleFontSize = data.title.length > 26 ? 54 : 62;
    ctx.font = `700 ${titleFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = data.theme.text;
    ctx.fillText(data.title, 110, 255);

    ctx.font = "600 26px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = data.theme.mutedText;
    ctx.fillText(data.primaryLabel, 110, 350);

    ctx.font = "700 118px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = data.theme.text;
    ctx.fillText(data.primaryValue, 110, 470);

    fillRoundedRect(ctx, 110, 520, 640, 68, 24, "rgba(255,255,255,0.11)");
    ctx.font = "600 28px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = data.theme.text;
    ctx.fillText(data.trendText, 140, 563);

    fillRoundedRect(ctx, 110, 640, 980, 250, 30, "rgba(10,15,28,0.18)");
    ctx.font = "600 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = data.theme.mutedText;
    ctx.fillText(data.historyLabel, 142, 695);
    drawSparkline(
        ctx,
        data.history,
        data.direction,
        150,
        735,
        900,
        120,
        data.theme.accent,
        "rgba(255,255,255,0.12)"
    );

    const metricY = 950;
    const cardWidth = 300;
    const gap = 30;
    data.metrics.slice(0, 3).forEach((metric, index) => {
        const x = 110 + index * (cardWidth + gap);
        fillRoundedRect(ctx, x, metricY, cardWidth, 210, 28, "rgba(255,255,255,0.10)");
        ctx.font = "600 22px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = data.theme.mutedText;
        ctx.fillText(metric.label, x + 28, metricY + 56);

        const valueFontSize = metric.value.length > 16 ? 36 : 44;
        ctx.font = `700 ${valueFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = data.theme.text;
        ctx.fillText(metric.value, x + 28, metricY + 132);
    });

    drawCardFooter(ctx, data);

    try {
        const dataUrl = canvas.toDataURL("image/png");
        return dataUrlToBlob(dataUrl);
    } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to create PNG data URL");
    }
}
