import { readJson, mutateJson } from '@/lib/store';
import { DAY_OPTIONS, normPhone } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 이름 + 핸드폰 번호로 본인 신청을 조회/수정/취소한다
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { action, name, phone, id } = body || {};
  if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || normPhone(phone).length < 10)
    return Response.json({ error: '이름과 핸드폰 번호를 입력해 주세요.' }, { status: 400 });

  const match = (a) => a.name === name.trim() && normPhone(a.phone) === normPhone(phone);

  if (action === 'list') {
    const apps = await readJson('applications.json');
    const mine = (Array.isArray(apps) ? apps : []).filter(match).reverse();
    return Response.json({ applications: mine });
  }

  if (action === 'cancel') {
    if (typeof id !== 'string') return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    let found = false;
    await mutateJson(
      'applications.json',
      (apps) =>
        (Array.isArray(apps) ? apps : []).filter((a) => {
          const hit = a.id === id && match(a);
          if (hit) found = true;
          return !hit;
        }),
      `신청 취소: ${name.trim()}`
    );
    if (!found) return Response.json({ error: '해당 신청을 찾을 수 없습니다.' }, { status: 404 });
    return Response.json({ ok: true });
  }

  if (action === 'update') {
    if (typeof id !== 'string') return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    const { hakdong, area, days, memo } = body;
    if (typeof hakdong !== 'boolean')
      return Response.json({ error: '거래방식을 선택해 주세요.' }, { status: 400 });
    if (area != null && (typeof area !== 'string' || area.length > 50))
      return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    if (!Array.isArray(days) || days.some((d) => !DAY_OPTIONS.includes(d)))
      return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    if (hakdong && days.length === 0)
      return Response.json({ error: '직거래 가능 요일을 하나 이상 선택해 주세요.' }, { status: 400 });
    if (memo != null && (typeof memo !== 'string' || memo.length > 500))
      return Response.json({ error: '메모가 너무 깁니다.' }, { status: 400 });

    let found = false;
    await mutateJson(
      'applications.json',
      (apps) =>
        (Array.isArray(apps) ? apps : []).map((a) => {
          if (a.id !== id || !match(a)) return a;
          found = true;
          return {
            ...a,
            hakdong,
            area: '',
            days: hakdong ? DAY_OPTIONS.filter((d) => days.includes(d)) : [],
            memo: (memo || '').trim(),
            updatedAt: new Date().toISOString(),
          };
        }),
      `신청 수정: ${name.trim()}`
    );
    if (!found) return Response.json({ error: '해당 신청을 찾을 수 없습니다.' }, { status: 404 });
    return Response.json({ ok: true });
  }

  return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
}
