import { readJson } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 항목별 신청자 수 집계 (개인정보 없이 개수만 공개)
export async function GET() {
  try {
    const apps = await readJson('applications.json');
    const counts = {};
    for (const a of Array.isArray(apps) ? apps : []) {
      for (const item of a.items || []) {
        counts[item.id] = (counts[item.id] || 0) + 1;
      }
    }
    return Response.json(
      { counts },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ counts: {} }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
