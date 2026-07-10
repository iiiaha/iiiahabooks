'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// 화면에 아무것도 그리지 않는 방문 집계기 — 세션당 1회, 관리자 페이지는 제외
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    try {
      if (sessionStorage.getItem('iiiaha_visited')) return;
      sessionStorage.setItem('iiiaha_visited', '1');
      fetch('/api/visit', { method: 'POST' }).catch(() => {});
    } catch {}
  }, [pathname]);

  return null;
}
