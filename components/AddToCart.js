'use client';

import Link from 'next/link';
import { useState } from 'react';
import { addBook } from '@/lib/cart';

export default function AddToCart({ book, sets }) {
  const [message, setMessage] = useState('');
  const sold = book.status !== 'available';

  const handle = () => {
    const r = addBook(book.id, sets);
    setMessage(r.ok ? '장바구니에 담았습니다.' : r.reason);
  };

  return (
    <div>
      <span className="btnrow" style={{ marginTop: 0 }}>
        <button className="btn-link" onClick={handle} disabled={sold}>
          {sold ? (book.status === 'reserved' ? '예약중' : '판매완료') : '장바구니에 담기'}
        </button>
        <Link href="/cart" className="textlink">
          장바구니로 이동 →
        </Link>
      </span>
      {message && <p className="msg">{message}</p>}
    </div>
  );
}
