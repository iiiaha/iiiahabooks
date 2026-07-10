'use client';

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
      <button className="btn" onClick={handle} disabled={sold}>
        {sold ? (book.status === 'reserved' ? '예약중' : '판매완료') : '장바구니에 담기'}
      </button>
      {message && <p className="msg">{message}</p>}
    </div>
  );
}
