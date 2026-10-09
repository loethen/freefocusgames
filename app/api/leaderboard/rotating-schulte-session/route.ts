import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { ROTATING_SCHULTE_SESSION_TTL_MS } from '@/lib/rotating-schulte-rules';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { playerId?: unknown } | null;
    const playerId = body?.playerId;
    if (typeof playerId !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as unknown as { DB: D1Database }).DB;
    const now = Date.now();
    const sessionId = crypto.randomUUID().replace(/-/g, '');
    // Replacing a player's session also invalidates their unfinished previous run.
    const session = await db.prepare(`
      INSERT INTO rotating_schulte_sessions (player_id, session_id, started_at) VALUES (?, ?, ?)
      ON CONFLICT(player_id) DO UPDATE SET session_id = excluded.session_id, started_at = excluded.started_at
      WHERE rotating_schulte_sessions.started_at <= ?
      RETURNING session_id
    `).bind(playerId, sessionId, now, now - 1000).first();
    if (!session) {
      return NextResponse.json({ error: 'Please wait before starting again' }, { status: 429 });
    }
    if (Math.random() < 0.01) {
      await db.prepare('DELETE FROM rotating_schulte_sessions WHERE started_at < ?')
        .bind(now - ROTATING_SCHULTE_SESSION_TTL_MS).run();
    }
    return NextResponse.json({ sessionId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Rotating Schulte session error:', error);
    return NextResponse.json({ error: 'Unable to start ranked session' }, { status: 503 });
  }
}
