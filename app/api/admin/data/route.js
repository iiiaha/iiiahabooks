import { readJson, writeJson } from '@/lib/store';
import { isAuthed, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!isAuthed(request)) return unauthorized();
  const [books, sets, config] = await Promise.all([
    readJson('books.json'),
    readJson('sets.json'),
    readJson('config.json'),
  ]);
  return Response.json({ books, sets, config });
}

export async function POST(request) {
  if (!isAuthed(request)) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'bad request' }, { status: 400 });
  }

  const saved = [];
  try {
    if (Array.isArray(body.books)) {
      await writeJson('books.json', body.books, 'admin: 도서 정보 수정');
      saved.push('books');
    }
    if (Array.isArray(body.sets)) {
      await writeJson('sets.json', body.sets, 'admin: 세트 정보 수정');
      saved.push('sets');
    }
    if (body.config && typeof body.config === 'object') {
      await writeJson('config.json', body.config, 'admin: 설정 수정');
      saved.push('config');
    }
  } catch (e) {
    console.error(e);
    return Response.json({ error: '저장에 실패했습니다. GITHUB_TOKEN 설정을 확인하세요.' }, { status: 500 });
  }
  return Response.json({ ok: true, saved });
}
