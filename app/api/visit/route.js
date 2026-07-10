import { readJson, mutateJson } from '@/lib/store';
import { isAuthed, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// KST 기준 오늘 날짜 (YYYY-MM-DD)
const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const shape = (v) => (v && typeof v === 'object' ? v : { total: 0, days: {} });

// 방문자 통계 조회 — 관리자 전용
export async function GET(request) {
  if (!isAuthed(request)) return unauthorized();
  try {
    const v = shape(await readJson('visits.json'));
    return Response.json(
      { total: v.total || 0, today: v.days?.[kstToday()] || 0, days: v.days || {} },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ total: 0, today: 0, days: {} });
  }
}

// 방문 1회 집계 (클라이언트가 세션당 한 번만 호출)
export async function POST() {
  const today = kstToday();
  try {
    await mutateJson(
      'visits.json',
      (v) => {
        const data = shape(v);
        data.total = (data.total || 0) + 1;
        data.days = data.days || {};
        data.days[today] = (data.days[today] || 0) + 1;
        return data;
      },
      `visit: ${today}`
    );
  } catch {
    // 집계 실패는 조용히 무시
  }
  return Response.json({ ok: true });
}
