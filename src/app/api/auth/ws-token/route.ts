// src/app/api/auth/ws-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Segredo compartilhado exclusivamente no backend (Vercel <-> Railway)
// NUNCA exposto em NEXT_PUBLIC_*
const SERVER_SECRET = process.env.WS_AUTH_SECRET || process.env.DASHBOARD_TOKEN || 'alicerce_auth_secret_shared_2026';
const ACCESS_COOKIE_NAME = 'alicerce_auth_session';
const DEFAULT_SYSTEM_ACCESS_KEY = process.env.DASHBOARD_ACCESS_KEY || 'alicerce_secure_session_token_2026';

export async function GET(req: NextRequest) {
  try {
    // 1. Verificação Estrita de Autorização
    // Rejeita acesso anônimo por padrão. Exige chave de autorização ou cookie de sessão válido.
    const authHeader = req.headers.get('authorization');
    const headerKey = req.headers.get('x-dashboard-key');
    const sessionCookie = req.cookies.get(ACCESS_COOKIE_NAME)?.value;

    const providedKey = authHeader?.replace('Bearer ', '') || headerKey || sessionCookie;

    // Se nenhuma credencial ou credencial inválida foi fornecida, nega imediatamente
    if (!providedKey || providedKey !== DEFAULT_SYSTEM_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'Não autorizado. Sessão inválida ou sem permissão para acessar os dados financeiros.' },
        { status: 401 }
      );
    }

    // 2. Emissão de Token de Sessão Assinado HMAC-SHA256 (60 segundos de validade)
    const timestamp = Date.now();
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
    return NextResponse.json({ error: 'Falha ao processar solicitação de sessão' }, { status: 500 });
  }
}
