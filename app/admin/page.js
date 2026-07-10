'use client';

import { useEffect, useState } from 'react';
import { won } from '@/lib/format';

const CAT_LABEL = { garm: 'GARM', annual: '애뉴얼', book: '단행본' };

export default function AdminPage() {
  const [authed, setAuthed] = useState(null); // null=확인중
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [books, setBooks] = useState([]);
  const [sets, setSets] = useState([]);
  const [config, setConfig] = useState(null);
  const [apps, setApps] = useState([]);
  const [visits, setVisits] = useState(null);
  const [tab, setTab] = useState('books');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    const res = await fetch('/api/admin/data');
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const json = await res.json();
    setBooks(json.books);
    setSets(json.sets);
    setConfig(json.config);
    setAuthed(true);
  };

  const loadApps = async () => {
    const res = await fetch('/api/admin/applications');
    if (res.ok) {
      const json = await res.json();
      setApps(json.applications);
    }
  };

  const deleteApp = async (id) => {
    if (!window.confirm('이 신청을 삭제할까요? 되돌릴 수 없습니다.')) return;
    const res = await fetch('/api/admin/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) loadApps();
    else setMsg('삭제에 실패했습니다.');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadVisits = async () => {
    const res = await fetch('/api/visit');
    if (res.ok) setVisits(await res.json());
  };

  useEffect(() => {
    if (authed && tab === 'apps') loadApps();
    if (authed && tab === 'visits') loadVisits();
  }, [authed, tab]);

  const login = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(null);
      await loadData();
    } else {
      setLoginError('비밀번호가 올바르지 않습니다.');
    }
  };

  const save = async (payload, label) => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setMsg(
        res.ok
          ? `${label} 저장 완료. 사이트에 바로 반영됩니다 (새로고침으로 확인).`
          : json.error || '저장 실패'
      );
    } catch {
      setMsg('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const setBookField = (id, field, value) =>
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  const setSetField = (id, field, value) =>
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  if (authed === null) return <div className="admin">확인 중…</div>;

  if (!authed) {
    return (
      <div className="admin" style={{ maxWidth: 360 }}>
        <h1>관리자 로그인</h1>
        <form onSubmit={login}>
          <div className="field">
            <label htmlFor="pw">비밀번호</label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <button className="btn" type="submit">
            로그인
          </button>
          {loginError && <p className="msg error">{loginError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin">
      <h1>관리자</h1>
      <div className="tabs" style={{ marginBottom: 32 }}>
        {[
          ['books', '도서 관리'],
          ['sets', '세트 관리'],
          ['config', '공지·마감 설정'],
          ['apps', `신청 목록${apps.length ? ` (${apps.length})` : ''}`],
          ['visits', '방문자'],
        ].map(([k, label]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {msg && <p className="msg" style={{ marginBottom: 20 }}>{msg}</p>}

      {tab === 'books' && (
        <>
          <table>
            <thead>
              <tr>
                <th>분류</th>
                <th>제목</th>
                <th>정가</th>
                <th>알라딘 중고시세</th>
                <th>판매가격(원)</th>
                <th>상태(별)</th>
                <th>판매상태</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id}>
                  <td>{CAT_LABEL[b.category]}</td>
                  <td>{b.title}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={b.listPrice ?? ''}
                      onChange={(e) =>
                        setBookField(b.id, 'listPrice', e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </td>
                  <td>
                    {b.aladinUsedUrl ? (
                      <a
                        href={b.aladinUsedUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'underline' }}
                      >
                        {b.usedPriceNote || '알라딘 보기'}
                      </a>
                    ) : (
                      b.usedPriceNote || '—'
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={b.salePrice ?? ''}
                      onChange={(e) =>
                        setBookField(b.id, 'salePrice', e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="starbtn"
                        title={b.condition === n ? '클릭하면 지워집니다' : `${n}점`}
                        style={{ color: b.condition >= n ? '#000' : '#ccc' }}
                        onClick={() =>
                          setBookField(b.id, 'condition', b.condition === n ? null : n)
                        }
                      >
                        {b.condition >= n ? '★' : '☆'}
                      </button>
                    ))}
                  </td>
                  <td>
                    <select
                      value={b.status}
                      onChange={(e) => setBookField(b.id, 'status', e.target.value)}
                    >
                      <option value="available">판매중</option>
                      <option value="reserved">예약중</option>
                      <option value="sold">판매완료</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="btnrow">
            <button className="btn" disabled={saving} onClick={() => save({ books }, '도서')}>
              {saving ? '저장 중…' : '도서 전체 저장'}
            </button>
          </div>
        </>
      )}

      {tab === 'sets' && (
        <>
          <table>
            <thead>
              <tr>
                <th>세트</th>
                <th>구성</th>
                <th>개별 합계</th>
                <th>세트 가격(원)</th>
                <th>판매</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((s) => {
                const prices = s.bookIds.map(
                  (id) => books.find((b) => b.id === id)?.salePrice
                );
                const sum = prices.every((p) => p != null)
                  ? prices.reduce((a, p) => a + Number(p), 0)
                  : null;
                return (
                  <tr key={s.id}>
                    <td>{s.title}</td>
                    <td>{s.bookIds.length}권</td>
                    <td>{sum != null ? won(sum) : '개별가 미완성'}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={s.price ?? ''}
                        onChange={(e) =>
                          setSetField(s.id, 'price', e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={s.enabled ? '1' : '0'}
                        onChange={(e) => setSetField(s.id, 'enabled', e.target.value === '1')}
                      >
                        <option value="1">판매중</option>
                        <option value="0">중단</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="btnrow">
            <button className="btn" disabled={saving} onClick={() => save({ sets }, '세트')}>
              {saving ? '저장 중…' : '세트 저장'}
            </button>
          </div>
        </>
      )}

      {tab === 'config' && config && (
        <div style={{ maxWidth: 560 }}>
          <div className="field">
            <label>소개 문구 (홈 왼쪽)</label>
            <textarea
              rows={5}
              value={config.intro}
              onChange={(e) => setConfig({ ...config, intro: e.target.value })}
            />
          </div>
          <div className="field">
            <label>공지 문구</label>
            <textarea
              rows={3}
              value={config.notice}
              onChange={(e) => setConfig({ ...config, notice: e.target.value })}
            />
          </div>
          <div className="field">
            <label>신청 마감 시각 (한국 시간, 비우면 마감 없음)</label>
            <input
              type="datetime-local"
              value={config.deadline || ''}
              onChange={(e) => setConfig({ ...config, deadline: e.target.value })}
            />
          </div>
          <div className="field">
            <label>신청 접수</label>
            <select
              value={config.applicationsOpen ? '1' : '0'}
              onChange={(e) => setConfig({ ...config, applicationsOpen: e.target.value === '1' })}
            >
              <option value="1">접수중</option>
              <option value="0">접수 중단</option>
            </select>
          </div>
          <div className="btnrow">
            <button className="btn" disabled={saving} onClick={() => save({ config }, '설정')}>
              {saving ? '저장 중…' : '설정 저장'}
            </button>
          </div>
        </div>
      )}

      {tab === 'visits' && (
        <div style={{ maxWidth: 420 }}>
          <div className="btnrow" style={{ marginTop: 0, marginBottom: 20 }}>
            <button className="btn ghost" onClick={loadVisits}>
              새로고침
            </button>
          </div>
          {!visits ? (
            <p className="empty">불러오는 중…</p>
          ) : (
            <>
              <p style={{ fontSize: 15, marginBottom: 20 }}>
                누적 방문자 <strong>{Number(visits.total).toLocaleString('ko-KR')}명</strong> · 오늘
                방문자 <strong>{Number(visits.today).toLocaleString('ko-KR')}명</strong>
              </p>
              <table>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>방문자</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(visits.days)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([day, n]) => (
                      <tr key={day}>
                        <td>{day}</td>
                        <td>{Number(n).toLocaleString('ko-KR')}명</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {tab === 'apps' && (
        <div className="apps">
          <div className="btnrow" style={{ marginTop: 0, marginBottom: 20 }}>
            <button className="btn ghost" onClick={loadApps}>
              새로고침
            </button>
          </div>
          {apps.length === 0 ? (
            <p className="empty">아직 접수된 신청이 없습니다.</p>
          ) : (
            apps.map((a) => (
              <div className="appcard" key={a.id}>
                <div className="who">
                  {a.name} · {a.phone}
                </div>
                <div style={{ color: '#8e8e8e', marginTop: 4 }}>
                  {new Date(a.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} ·{' '}
                  {a.total != null ? `합계 ${won(a.total)}` : '일부 가격 미정'}
                </div>
                {a.hakdong !== undefined && (
                  <div style={{ marginTop: 6 }}>
                    거래방식: {a.hakdong ? '학동역(7호선) 직거래' : `택배 거래${a.area ? ` · 희망 지역: ${a.area}` : ''}`}
                    {a.days?.length > 0 && <> · 가능 요일: {a.days.join(', ')}</>}
                  </div>
                )}
                <ul>
                  {a.items.map((i) => (
                    <li key={`${a.id}-${i.type}-${i.id}`}>
                      {i.title} — {won(i.price) ?? '가격 미정'}
                    </li>
                  ))}
                </ul>
                {a.memo && <p style={{ marginTop: 10 }}>메모: {a.memo}</p>}
                <div className="btnrow" style={{ marginTop: 12 }}>
                  <button className="textlink" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => deleteApp(a.id)}>
                    신청 삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
