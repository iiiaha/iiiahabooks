import { checkPassword, sign, COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'bad request' }, { status: 400 });
  }
  if (!checkPassword(body?.password))
    return Response.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `${COOKIE}=${sign()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure}`,
    },
  });
}
