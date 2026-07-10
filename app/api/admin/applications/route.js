import { readJson } from '@/lib/store';
import { isAuthed, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!isAuthed(request)) return unauthorized();
  const apps = await readJson('applications.json');
  return Response.json({ applications: Array.isArray(apps) ? [...apps].reverse() : [] });
}
