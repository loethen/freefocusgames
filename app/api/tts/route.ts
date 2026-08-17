import { NextRequest, NextResponse } from "next/server";

const MAX_TEXT_LENGTH = 200;
const GOOGLE_TTS_ENDPOINT = "https://translate.google.com/translate_tts";

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!text) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  const upstreamUrl = new URL(GOOGLE_TTS_ENDPOINT);
  upstreamUrl.search = new URLSearchParams({
    ie: "UTF-8",
    client: "tw-ob",
    tl: "en",
    q: text,
  }).toString();

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
        Referer: "https://translate.google.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
      },
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !contentType.toLowerCase().startsWith("audio/")) {
      console.error("Google Translate TTS request failed", {
        status: upstream.status,
        contentType,
      });
      return NextResponse.json({ error: "Speech service unavailable." }, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Google Translate TTS proxy failed", error);
    return NextResponse.json({ error: "Speech service unavailable." }, { status: 502 });
  }
}
