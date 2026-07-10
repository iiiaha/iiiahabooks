'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart } from '@/lib/cart';

export default function Header() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getCart().length);
    update();
    window.addEventListener('cart-change', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('cart-change', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return (
    <header className="header">
      <Link href="/" className="brand">
        책장을 정리합니다.
      </Link>
      <nav>
        <Link href="/">도서</Link>
        <Link href="/cart">장바구니{count > 0 ? ` ${count}` : ''}</Link>
      </nav>
    </header>
  );
}
