'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart, removeItem, clearCart } from '@/lib/cart';
import { won, deadlinePassed, deadlineLabel } from '@/lib/format';
import { DAY_OPTIONS } from '@/lib/constants';

export default function CartView({ books, sets, config }) {
  const [cart, setCartState] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [memo, setMemo] = useState('');
  const [hakdong, setHakdong] = useState(''); // 'yes' | 'no'
  const [area, setArea] = useState('');
  const [days, setDays] = useState([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // {ok, message}

  const toggleDay = (d) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  useEffect(() => {
    const update = () => setCartState(getCart());
    update();
    setLoaded(true);
    window.addEventListener('cart-change', update);
    return () => window.removeEventListener('cart-change', update);
  }, []);

  const resolved = cart
    .map((item) => {
      if (item.type === 'book') {
        const b = books.find((x) => x.id === item.id);
        return b && { ...item, title: b.title, price: b.salePrice, thumb: b.thumb, href: `/books/${b.id}` };
      }
      const s = sets.find((x) => x.id === item.id);
      return s && { ...item, title: s.title, price: s.price, thumb: null, count: s.bookIds.length };
    })
    .filter(Boolean);

  const allPriced = resolved.every((i) => i.price != null);
  const total = allPriced ? resolved.reduce((a, i) => a + Number(i.price), 0) : null;

  const closed = !config.applicationsOpen || deadlinePassed(config.deadline);

  const submit = async (e) => {
    e.preventDefault();
    if (hakdong === '') {
      setResult({ ok: false, message: '학동역 인근 직거래 가능 여부를 선택해 주세요.' });
      return;
    }
    if (hakdong === 'no' && !area.trim()) {
      setResult({ ok: false, message: '거래 희망 지역을 입력해 주세요.' });
      return;
    }
    if (days.length === 0) {
      setResult({ ok: false, message: '거래 가능 요일을 하나 이상 선택해 주세요.' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          memo,
          hakdong: hakdong === 'yes',
          area: hakdong === 'no' ? area : '',
          days,
          items: cart,
          website: '',
        }),
      });
      const json = await res.json();
      if (res.ok) {
        clearCart();
        setResult({ ok: true, message: '거래 신청이 접수되었습니다. 신청 마감 후 선정되신 분께 입력하신 연락처로 연락드리겠습니다.' });
      } else {
        setResult({ ok: false, message: json.error || '신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
      }
    } catch {
      setResult({ ok: false, message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setSending(false);
    }
  };

  if (!loaded) return <div className="cartpage" />;

  if (result?.ok) {
    return (
      <div className="cartpage">
        <h1>신청 완료</h1>
        <p className="msg">{result.message}</p>
        <div className="btnrow">
          <Link href="/" className="btn ghost">
            도서 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cartpage">
      <h1>장바구니</h1>

      {resolved.length === 0 ? (
        <p className="empty">
          장바구니가 비어 있습니다. <Link href="/">도서 목록</Link>에서 책을 담아주세요.
        </p>
      ) : (
        <>
          <div>
            {resolved.map((i) => (
              <div className="cartitem" key={`${i.type}-${i.id}`}>
                {i.thumb ? (
                  <Link href={i.href}>
                    <img src={i.thumb} alt={i.title} />
                  </Link>
                ) : (
                  <div style={{ fontSize: 12, color: '#8b8b94' }}>세트 {i.count}권</div>
                )}
                <div>
                  <div className="t">{i.href ? <Link href={i.href}>{i.title}</Link> : i.title}</div>
                  <div className="p">{won(i.price) ?? '가격 미정'}</div>
                </div>
                <button className="rm" onClick={() => removeItem(i.type, i.id)}>
                  삭제
                </button>
              </div>
            ))}
          </div>
          <div className="carttotal">
            <span>합계</span>
            <span>{total != null ? won(total) : '일부 가격 미정'}</span>
          </div>

          <div className="form formbox">
            <h2>거래 신청하기</h2>
            {config.deadline && (
              <p className="hint">신청 마감: {deadlineLabel(config.deadline)}</p>
            )}
            {closed ? (
              <p className="msg error">
                지금은 거래 신청을 받지 않습니다. {config.deadline ? '신청이 마감되었습니다.' : ''}
              </p>
            ) : (
              <>
                <p className="hint">
                  신청은 구매 확정이 아닙니다. 마감 후 판매자가 신청자 중 구매자를 선정해 아래
                  연락처로 개별 연락드리며, 계좌이체 직거래로 진행됩니다.
                  <br />
                  거래 우선순위: <strong>① 세트 구매(전체 53권 세트 최우선) ② 단권 구매</strong>.
                  신청자가 여러 명이면 <strong>학동역(7호선) 인근 직거래 가능한 분께 우선 판매</strong>됩니다.
                </p>
                <form onSubmit={submit}>
                  <div className="fieldrow">
                    <div className="field">
                      <label htmlFor="name">이름 *</label>
                      <input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={30}
                        placeholder="홍길동"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="phone">핸드폰 번호 * (선정 시 연락드릴 번호)</label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        pattern="01[0-9]-?[0-9]{3,4}-?[0-9]{4}"
                        placeholder="010-1234-5678"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>학동역(7호선) 인근 직거래가 가능하신가요? *</label>
                    <div className="chips">
                      {[
                        ['yes', '가능'],
                        ['no', '불가능'],
                      ].map(([v, label]) => (
                        <label key={v} className={`chip${hakdong === v ? ' on' : ''}`}>
                          <input
                            type="radio"
                            name="hakdong"
                            value={v}
                            checked={hakdong === v}
                            onChange={() => setHakdong(v)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  {hakdong === 'no' && (
                    <div className="field">
                      <label htmlFor="area">거래 희망 지역 *</label>
                      <input
                        id="area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        maxLength={50}
                        placeholder="예: 2호선 강남역 인근"
                      />
                      <p className="hint" style={{ marginTop: 6, marginBottom: 0 }}>
                        신청자가 여러 명일 경우 학동역 인근 직거래 가능한 분께 우선 판매됩니다.
                      </p>
                    </div>
                  )}
                  <div className="field">
                    <label>거래 가능 요일 * (7/20~7/26 중 선택)</label>
                    <div className="chips">
                      {DAY_OPTIONS.map((d) => (
                        <label key={d} className={`chip${days.includes(d) ? ' on' : ''}`}>
                          <input
                            type="checkbox"
                            checked={days.includes(d)}
                            onChange={() => toggleDay(d)}
                          />
                          {d}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="memo">남기실 말씀 (선택)</label>
                    <textarea
                      id="memo"
                      rows={3}
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                  {/* 스팸 방지용 — 사람은 채우지 않는 필드 */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ position: 'absolute', left: '-9999px' }}
                    aria-hidden="true"
                  />
                  <button className="btn primary" type="submit" disabled={sending}>
                    {sending ? '접수 중…' : '거래 신청하기'}
                  </button>
                </form>
              </>
            )}
            {result && !result.ok && <p className="msg error">{result.message}</p>}
          </div>
        </>
      )}
    </div>
  );
}
