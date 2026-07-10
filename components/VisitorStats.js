'use client';

import { useEffect, useState } from 'react';

export default function VisitorStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const visited = sessionStorage.getItem('iiiaha_visited');
        const res = await fetch('/api/visit', { method: visited ? 'GET' : 'POST' });
        if (!visited) sessionStorage.setItem('iiiaha_visited', '1');
        const j = await res.json();
        if (alive && j) setStats(j);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!stats) return null;

  return (
    <p className="visitstamp">
      누적 방문자 {Number(stats.total).toLocaleString('ko-KR')}
      <br />
      오늘 방문자 {Number(stats.today).toLocaleString('ko-KR')}
    </p>
  );
}
