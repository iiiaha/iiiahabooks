'use client';

import { useState } from 'react';
import { won } from '@/lib/format';
import { DAY_OPTIONS } from '@/lib/constants';

function EditForm({ app, name, phone, onDone, onCancel }) {
  const [hakdong, setHakdong] = useState(app.hakdong ? 'yes' : 'no');
  const [days, setDays] = useState(app.days || []);
  const [memo, setMemo] = useState(app.memo || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const toggleDay = (d) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const save = async () => {
    if (hakdong === 'yes' && days.length === 0)
      return setErr('직거래 가능 요일을 하나 이상 선택해 주세요.');
    setSaving(true);
    setErr('');
    const res = await fetch('/api/my', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        name,
        phone,
        id: app.id,
        hakdong: hakdong === 'yes',
        area: '',
        days: hakdong === 'yes' ? days : [],
        memo,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (res.ok) onDone();
    else setErr(json.error || '수정에 실패했습니다.');
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #ebebeb' }}>
      <div className="field">
        <label>거래방식</label>
        <div className="choicerow">
          <label>
            <input type="radio" checked={hakdong === 'yes'} onChange={() => setHakdong('yes')} />{' '}
            학동역(7호선) 직거래
          </label>
          <label>
            <input type="radio" checked={hakdong === 'no'} onChange={() => setHakdong('no')} /> 택배
            거래
          </label>
        </div>
        {hakdong === 'no' && (
          <p className="hint" style={{ marginTop: 6, marginBottom: 0 }}>
            <strong>세트 구매</strong> 건의 경우 택배비는 제가 부담하겠습니다.{' '}
            <strong>단권 구매</strong> 시에는 착불로 발송되는 점 양해 부탁드립니다.
          </p>
        )}
      </div>
      {hakdong === 'yes' && (
        <div className="field">
          <label>직거래 가능 요일</label>
          <div className="choicerow">
            {DAY_OPTIONS.map((d) => (
              <label key={d}>
                <input type="checkbox" checked={days.includes(d)} onChange={() => toggleDay(d)} /> {d}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="field">
        <label>남기실 말씀</label>
        <textarea rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={500} />
      </div>
      <div className="btnrow" style={{ marginTop: 4 }}>
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </button>
        <button className="btn ghost" onClick={onCancel}>
          닫기
        </button>
      </div>
      {err && <p className="msg error">{err}</p>}
    </div>
  );
}

export default function MyPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [apps, setApps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState(null);

  const lookup = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setMsg('');
    setEditingId(null);
    try {
      const res = await fetch('/api/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', name, phone }),
      });
      const json = await res.json();
      if (res.ok) setApps(json.applications);
      else setMsg(json.error || '조회에 실패했습니다.');
    } catch {
      setMsg('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('이 신청을 취소할까요? 취소하면 되돌릴 수 없습니다.')) return;
    const res = await fetch('/api/my', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', name, phone, id }),
    });
    if (res.ok) {
      setMsg('신청이 취소되었습니다.');
      lookup();
    } else {
      const json = await res.json();
      setMsg(json.error || '취소에 실패했습니다.');
    }
  };

  return (
    <div className="cartpage">
      <h1>신청확인</h1>
      <p className="hint" style={{ marginTop: 8, fontSize: 12, color: '#a8a8a8', lineHeight: 1.6 }}>
        신청할 때 입력한 이름과 핸드폰 번호를 입력하면 내 신청 내역을 확인하고 수정·취소할 수
        있습니다.
      </p>

      <form onSubmit={lookup} className="form" style={{ marginTop: 24, paddingTop: 0, borderTop: 'none' }}>
        <div className="field">
          <label htmlFor="name">이름</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={30} />
        </div>
        <div className="field">
          <label htmlFor="phone">핸드폰 번호</label>
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
        <button className="btn" type="submit" disabled={loading}>
          {loading ? '조회 중…' : '신청 내역 조회'}
        </button>
      </form>

      {msg && <p className="msg">{msg}</p>}

      {apps !== null && (
        <div style={{ marginTop: 32 }}>
          {apps.length === 0 ? (
            <p className="empty">해당 정보로 접수된 신청이 없습니다.</p>
          ) : (
            apps.map((a) => (
              <div className="appcard" key={a.id}>
                <div className="who">
                  {new Date(a.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                  {' · '}
                  {a.total != null ? `합계 ${won(a.total)}` : '일부 가격 미정'}
                </div>
                <ul>
                  {a.items.map((i) => (
                    <li key={`${a.id}-${i.type}-${i.id}`}>
                      {i.title} — {won(i.price) ?? '가격 미정'}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 10, fontSize: 12, color: '#8e8e8e' }}>
                  거래방식: {a.hakdong ? '학동역(7호선) 직거래' : '택배 거래'}
                  {a.days?.length > 0 && <> · 직거래 가능 요일: {a.days.join(', ')}</>}
                  {a.memo && (
                    <>
                      <br />
                      메모: {a.memo}
                    </>
                  )}
                </div>
                <div className="btnrow" style={{ marginTop: 12 }}>
                  <button
                    className="btn-link"
                    onClick={() => setEditingId(editingId === a.id ? null : a.id)}
                  >
                    {editingId === a.id ? '수정 닫기' : '내용 수정'}
                  </button>
                  <button className="textlink" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => cancel(a.id)}>
                    신청 취소
                  </button>
                </div>
                {editingId === a.id && (
                  <>
                    <p style={{ marginTop: 10, fontSize: 12, color: '#a8a8a8' }}>
                      구매 항목을 바꾸려면 신청을 취소한 뒤 장바구니에서 다시 신청해 주세요.
                    </p>
                    <EditForm
                      app={a}
                      name={name}
                      phone={phone}
                      onDone={() => {
                        setEditingId(null);
                        setMsg('수정되었습니다.');
                        lookup();
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
