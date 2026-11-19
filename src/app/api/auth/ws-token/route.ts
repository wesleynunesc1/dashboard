// src/app/api/auth/ws-token/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Secret compartilhado exclusivamente no backend (Vercel <-> Railway)
// NUNCA exposto em NEXT_PUBLIC_*
const SERVER_SECRET = process.env.WS_AUTH_SECRET || process.env.DASHBOARD_TOKEN || 'alicerce_auth_secret_shared_2026';

export async function GET() {
  try {
    const timestamp = Date.now();
    // Gera token temporário com validade de 60 segundos
    const payload = `subscriber:${timestamp}`;
    const hmac = crypto.createHmac('sha256', SERVER_SECRET);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    const tempToken = `tmp_${timestamp}_${signature}`;

    return NextResponse.json({
      token: tempToken,
      expiresInMs: 60000
    });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao emitir token de sessão' }, { status: 500 });
  }
}
