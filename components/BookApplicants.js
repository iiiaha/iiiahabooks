'use client';

import { useEffect, useState } from 'react';

export default function BookApplicants({ book, sets }) {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/stats')
        .then((r) => r.json())
        .then((j) => {
          if (alive) setCounts(j.counts || {});
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!counts) return null;

  const direct = counts[book.id] || 0;
  const covering = sets
    .filter((s) => s.bookIds.includes(book.id))
    .map((s) => ({ title: s.title, n: counts[s.id] || 0 }))
    .filter((s) => s.n > 0);
  const setTotal = covering.reduce((a, s) => a + s.n, 0);

  return (
    <div className="applybox">
      <p>
        이 책은 현재 <strong>{setTotal}분</strong>께서 세트 신청, <strong>{direct}분</strong>께서 단권
        신청해주셨습니다.
        {covering.length > 0 && (
          <>
            <br />({covering.map((s) => `${s.title} ${s.n}명`).join(', ')})
          </>
        )}
      </p>
      <p style={{ marginTop: 8 }}>
        거래 우선순위는 <strong>① 세트 구매(전체 53권 세트 최우선) ② 단권 구매</strong> 순입니다.
        {setTotal > 0
          ? ` 현재 이 책이 포함된 세트에 신청자 ${setTotal}명이 있어 세트 신청자에게 우선권이 있으며, 세트 신청이 모두 취소되는 경우에만 단권 신청 순으로 거래가 진행됩니다.`
          : ' 아직 이 책이 포함된 세트 신청자가 없어, 지금 신청하면 단권 기준으로 우선 검토됩니다.'}
      </p>
    </div>
  );
}
