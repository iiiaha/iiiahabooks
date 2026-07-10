'use client';

import Link from 'next/link';
import { useState } from 'react';
import { addSet } from '@/lib/cart';
import { won, deadlineLabel } from '@/lib/format';

const CATEGORIES = [
  { key: 'garm', label: 'GARM 매거진' },
  { key: 'annual', label: '애뉴얼 인테리어 디테일' },
  { key: 'book', label: '단행본' },
];

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'garm', label: 'GARM 매거진' },
  { key: 'annual', label: '애뉴얼 디테일' },
  { key: 'book', label: '단행본' },
  { key: 'set', label: '세트구매' },
];

function BookCard({ book }) {
  const sold = book.status !== 'available';
  return (
    <Link href={`/books/${book.id}`} className={`card${sold ? ' sold' : ''}`}>
      <div className="thumbbox">
        <img src={book.thumb} alt={book.title} loading="lazy" />
        {sold && <span className="soldmark">{book.status === 'reserved' ? '예약중' : '판매완료'}</span>}
      </div>
      <div className="meta">
        <div className="title">{book.title}</div>
        <div className="price">{won(book.salePrice) ?? '가격 미정'}</div>
      </div>
    </Link>
  );
}

function SetCard({ set, sets, books, onMessage }) {
  const members = set.bookIds
    .map((id) => books.find((b) => b.id === id))
    .filter(Boolean);
  const allAvailable = members.every((b) => b.status === 'available');
  const prices = members.map((b) => b.salePrice);
  const sum = prices.every((p) => p != null)
    ? prices.reduce((a, p) => a + Number(p), 0)
    : null;
  const discount =
    sum != null && set.price != null && sum > set.price
      ? Math.round((1 - set.price / sum) * 100)
      : null;

  const handleAdd = () => {
    const r = addSet(set.id, sets);
    if (!r.ok) onMessage(r.reason);
    else if (set.id === 'set-all' && r.replaced)
      onMessage('전체 세트를 담으면서 기존 장바구니 항목을 비웠습니다.');
    else if (r.replaced)
      onMessage('세트에 포함된 개별 도서를 장바구니에서 세트로 대체했습니다.');
    else onMessage(`"${set.title}"를 장바구니에 담았습니다.`);
  };

  return (
    <div className="setcard">
      <div className="covers">
        {members.slice(0, 8).map((b) => (
          <img key={b.id} src={b.thumb} alt={b.title} loading="lazy" />
        ))}
      </div>
      <div>
        <h3>{set.title}</h3>
        <p className="desc">{set.description}</p>
        {discount != null && (
          <p className="benefit">
            개별 구매 합계 {won(sum)} → 세트 {won(set.price)} · <strong>{discount}% 할인</strong> ({won(sum - set.price)} 절약)
          </p>
        )}
        <p className="price">{won(set.price) ?? '가격 미정'}</p>
        <div className="btnrow">
          <button className="btn" onClick={handleAdd} disabled={!allAvailable || !set.enabled}>
            {allAvailable && set.enabled ? '장바구니에 담기' : '판매 불가 (일부 판매됨)'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Shop({ books, sets, config }) {
  const [tab, setTab] = useState('all');
  const [message, setMessage] = useState('');

  const notify = (m) => {
    setMessage(m);
    if (m) setTimeout(() => setMessage(''), 4000);
  };

  const visibleCategories =
    tab === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.key === tab);

  return (
    <div className="home">
      <aside>
        <div className="bio">
          {config.intro}
          {config.notice && <p className="notice">{config.notice}</p>}
          {config.deadline && (
            <p className="deadline">신청 마감 {deadlineLabel(config.deadline)}</p>
          )}
          {message && <p className="msg">{message}</p>}
        </div>
      </aside>

      <main>
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'set' ? (
          <div className="setlist">
            {sets
              .filter((s) => s.enabled)
              .map((s) => (
                <SetCard key={s.id} set={s} sets={sets} books={books} onMessage={notify} />
              ))}
          </div>
        ) : (
          visibleCategories.map((cat) => {
            const list = books.filter((b) => b.category === cat.key);
            if (list.length === 0) return null;
            return (
              <section key={cat.key} className="section">
                <h2>
                  {cat.label} · {list.length}권
                </h2>
                <div className="grid">
                  {list.map((b) => (
                    <BookCard key={b.id} book={b} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
