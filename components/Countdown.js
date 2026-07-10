'use client';

import { useEffect, useState } from 'react';
import { deadlineDate } from '@/lib/format';

export default function Countdown({ deadline }) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    const d = deadlineDate(deadline);
    if (!d) return;
    const tick = () => setLeft(d.getTime() - Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  if (left === null) return null;
  if (left <= 0) return <p className="countdown">신청이 마감되었습니다</p>;

  const s = Math.floor(left / 1000);
  const days = Math.floor(s / 86400);
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');

  return (
    <p className="countdown">
      마감까지 {days > 0 ? `${days}일 ` : ''}
      {h}:{m}:{sec}
    </p>
  );
}
