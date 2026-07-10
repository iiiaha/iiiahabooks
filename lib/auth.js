import crypto from 'crypto';

export const COOKIE = 'iiiaha_admin';

function secret() {
  return process.env.ADMIN_PASSWORD || 'dev-password';
}

export function sign() {
  return crypto.createHmac('sha256', secret()).update('iiiahabooks-admin-v1').digest('hex');
}

export function checkPassword(pw) {
  if (typeof pw !== 'string' || !pw) return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(secret());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAuthed(request) {
  const token = request.cookies.get(COOKIE)?.value;
  return !!token && token === sign();
}

export function unauthorized() {
  return Response.json({ error: 'unauthorized' }, { status: 401 });
}
