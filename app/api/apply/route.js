import { readJson, mutateJson } from '@/lib/store';
import { deadlinePassed } from '@/lib/format';
import { DAY_OPTIONS } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PHONE_RE = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { name, phone, memo, hakdong, area, days, items, website } = body || {};

  // honeypot — 봇이 채우는 숨은 필드
  if (website) return Response.json({ ok: true });

  if (typeof name !== 'string' || !name.trim() || name.length > 30)
    return Response.json({ error: '이름을 입력해 주세요.' }, { status: 400 });
  if (typeof phone !== 'string' || !PHONE_RE.test(phone.trim()))
    return Response.json({ error: '올바른 핸드폰 번호를 입력해 주세요. (예: 010-1234-5678)' }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0 || items.length > 60)
    return Response.json({ error: '장바구니가 비어 있습니다.' }, { status: 400 });
  if (memo != null && (typeof memo !== 'string' || memo.length > 500))
    return Response.json({ error: '메모가 너무 깁니다.' }, { status: 400 });
  if (typeof hakdong !== 'boolean')
    return Response.json({ error: '학동역 인근 직거래 가능 여부를 선택해 주세요.' }, { status: 400 });
  if (!hakdong && (typeof area !== 'string' || !area.trim() || area.length > 50))
    return Response.json({ error: '거래 희망 지역을 입력해 주세요.' }, { status: 400 });
  if (!Array.isArray(days) || days.length === 0 || days.some((d) => !DAY_OPTIONS.includes(d)))
    return Response.json({ error: '거래 가능 요일(7/20~7/26)을 하나 이상 선택해 주세요.' }, { status: 400 });

  const [config, books, sets] = await Promise.all([
    readJson('config.json'),
    readJson('books.json'),
    readJson('sets.json'),
  ]);

  if (!config.applicationsOpen || deadlinePassed(config.deadline))
    return Response.json({ error: '거래 신청이 마감되었습니다.' }, { status: 403 });

  // 항목 검증 + 스냅샷 (신청 시점의 제목/가격 고정)
  const snapshot = [];
  const seen = new Set();
  for (const item of items) {
    if (!item || (item.type !== 'book' && item.type !== 'set') || typeof item.id !== 'string')
      return Response.json({ error: '잘못된 장바구니 항목이 있습니다.' }, { status: 400 });
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (item.type === 'book') {
      const b = books.find((x) => x.id === item.id);
      if (!b) return Response.json({ error: '존재하지 않는 도서가 있습니다.' }, { status: 400 });
      if (b.status !== 'available')
        return Response.json({ error: `"${b.title}"은(는) 이미 판매되었거나 예약중입니다.` }, { status: 409 });
      snapshot.push({ type: 'book', id: b.id, title: b.title, price: b.salePrice });
    } else {
      const s = sets.find((x) => x.id === item.id);
      if (!s || !s.enabled)
        return Response.json({ error: '존재하지 않거나 판매 종료된 세트가 있습니다.' }, { status: 400 });
      const unavailable = s.bookIds
        .map((id) => books.find((b) => b.id === id))
        .filter((b) => b && b.status !== 'available');
      if (unavailable.length > 0)
        return Response.json({ error: `"${s.title}"에 이미 판매된 책이 포함되어 있어 신청할 수 없습니다.` }, { status: 409 });
      snapshot.push({ type: 'set', id: s.id, title: s.title, price: s.price, count: s.bookIds.length });
    }
  }

  const total = snapshot.every((i) => i.price != null)
    ? snapshot.reduce((a, i) => a + Number(i.price), 0)
    : null;

  const application = {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    name: name.trim(),
    phone: phone.trim(),
    memo: (memo || '').trim(),
    hakdong,
    area: hakdong ? '' : area.trim(),
    days: DAY_OPTIONS.filter((d) => days.includes(d)),
    items: snapshot,
    total,
  };

  try {
    await mutateJson(
      'applications.json',
      (apps) => [...(Array.isArray(apps) ? apps : []), application],
      `application: ${application.name} (${snapshot.length}건)`
    );
  } catch (e) {
    console.error(e);
    return Response.json({ error: '신청 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }

  return Response.json({ ok: true, id: application.id });
}
