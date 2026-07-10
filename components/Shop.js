'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Countdown from '@/components/Countdown';
import { addSet } from '@/lib/cart';
import { won, deadlineLabel } from '@/lib/format';

const CATEGORIES = [
  { key: 'garm', label: 'GARM 매거진' },
  { key: 'annual', label: '애뉴얼 인테리어 디테일' },
  { key: 'book', label: '단행본' },
];

const TABS = [
  { key: 'set', label: '세트구매' },
  { key: 'garm', label: 'GARM 매거진' },
  { key: 'annual', label: '애뉴얼 디테일' },
  { key: 'book', label: '단행본' },
];

// 권수에 맞는 열 수 — 53권=9열(6행), 22권=8열(3행), 19권=7열(3행), 12권=6열(2행)
function coversCols(n) {
  if (n >= 40) return 9;
  if (n >= 20) return 8;
  if (n >= 16) return 7;
  return 6;
}

function BookCard({ book, sets, counts }) {
  const sold = book.status !== 'available';
  const direct = counts[book.id] || 0;
  const viaSets = sets
    .filter((s) => s.bookIds.includes(book.id))
    .reduce((a, s) => a + (counts[s.id] || 0), 0);
  return (
    <Link href={`/books/${book.id}`} className={`card${sold ? ' sold' : ''}`}>
      <div className="thumbbox">
        <img src={book.thumb} alt={book.title} loading="lazy" />
        {sold && <span className="soldmark">{book.status === 'reserved' ? '예약중' : '판매완료'}</span>}
      </div>
      <div className="meta">
        <div className="title">{book.title}</div>
        <div className="price">
          {book.listPrice != null && <span className="strike">{won(book.listPrice)}</span>}
          <span className="now">{won(book.salePrice) ?? '가격 미정'}</span>
        </div>
        {(direct > 0 || viaSets > 0) && (
          <div className="applicants">
            {viaSets > 0 && `세트 신청 ${viaSets}`}
            {direct > 0 && viaSets > 0 && ' · '}
            {direct > 0 && `단권 신청 ${direct}`}
          </div>
        )}
      </div>
    </Link>
  );
}

function SetCard({ set, sets, books, counts, onMessage }) {
  const members = set.bookIds
    .map((id) => books.find((b) => b.id === id))
    .filter(Boolean);
  const allAvailable = members.every((b) => b.status === 'available');
  const prices = members.map((b) => b.salePrice);
  const sum = prices.every((p) => p != null)
    ? prices.reduce((a, p) => a + Number(p), 0)
    : null;
  // 정가 미확인(독립출판물 등)인 책은 빼고 합산
  const listSum = members.some((b) => b.listPrice != null)
    ? members.reduce((a, b) => a + (Number(b.listPrice) || 0), 0)
    : null;
  const discount =
    sum != null && set.price != null && sum > set.price
      ? Math.round((1 - set.price / sum) * 100)
      : null;
  const applicants = counts[set.id] || 0;
  const allSetApplicants = set.id === 'set-all' ? 0 : counts['set-all'] || 0;

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
      <div className="covers" style={{ gridTemplateColumns: `repeat(${coversCols(members.length)}, 1fr)` }}>
        {members.map((b) => (
          <img key={b.id} src={b.thumb} alt={b.title} loading="lazy" />
        ))}
      </div>
      <div>
        <h3>{set.title}</h3>
        <p className="desc">{set.description}</p>
        <p className="price">
          {listSum != null && (
            <>
              <span className="listsum">정가 합계 {won(listSum)}</span>
              <br />
            </>
          )}
          <span className="now">{won(set.price) ?? '가격 미정'}</span>
          {discount != null && (
            <span className="discountnote"> (개별구매 대비 {discount}% 할인)</span>
          )}
        </p>
        <p className="applicants">
          현재 신청 <strong>{applicants}명</strong>
          {allSetApplicants > 0 && (
            <>
              <br />
              전체 53권 세트 신청 {allSetApplicants}명에게 우선권이 있습니다
            </>
          )}
        </p>
        <div className="btnrow">
          <button className="btn-link" onClick={handleAdd} disabled={!allAvailable || !set.enabled}>
            {allAvailable && set.enabled ? '장바구니에 담기' : '판매 불가 (일부 판매됨)'}
          </button>
          <Link href="/cart" className="textlink">
            장바구니로 이동 →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Shop({ books, sets, config }) {
  const [tab, setTab] = useState('set');
  const [message, setMessage] = useState('');
  const [counts, setCounts] = useState({});

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

  const notify = (m) => {
    setMessage(m);
    if (m) setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="home">
      <aside>
        <div className="bio">
          {config.intro}
          {config.notice && <p className="notice">{config.notice}</p>}
          <p className="notice">
            거래 우선순위: <strong>① 세트 구매</strong> (전체 53권 세트 최우선) <strong>② 단권 구매</strong>.
            신청자가 여러 명이면 학동역(7호선) 인근 직거래 가능한 분께 우선 판매합니다.
          </p>
          {config.deadline && (
            <>
              <p className="deadline">신청 마감 {deadlineLabel(config.deadline)}</p>
              <Countdown deadline={config.deadline} />
            </>
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
                <SetCard key={s.id} set={s} sets={sets} books={books} counts={counts} onMessage={notify} />
              ))}
          </div>
        ) : (
          CATEGORIES.filter((c) => c.key === tab).map((cat) => {
            let list = books.filter((b) => b.category === cat.key);
            // 애뉴얼 인테리어 디테일은 최신호(2025)부터 내림차순
            if (cat.key === 'annual')
              list = [...list].sort((a, b) => b.id.localeCompare(a.id));
            if (list.length === 0) return null;
            return (
              <section key={cat.key} className="section">
                <h2>
                  {cat.label} · {list.length}권
                </h2>
                <div className="grid">
                  {list.map((b) => (
                    <BookCard key={b.id} book={b} sets={sets} counts={counts} />
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
