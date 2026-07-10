import { readJson, mutateJson } from '@/lib/store';
import { isAuthed, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!isAuthed(request)) return unauthorized();
  const apps = await readJson('applications.json');
  return Response.json({ applications: Array.isArray(apps) ? [...apps].reverse() : [] });
}

export async function DELETE(request) {
  if (!isAuthed(request)) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'bad request' }, { status: 400 });
  }
  if (typeof body?.id !== 'string')
    return Response.json({ error: 'bad request' }, { status: 400 });
  await mutateJson(
    'applications.json',
    (apps) => (Array.isArray(apps) ? apps : []).filter((a) => a.id !== body.id),
    `admin: 신청 삭제 (${body.id})`
  );
  return Response.json({ ok: true });
}
