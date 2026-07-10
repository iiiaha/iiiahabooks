'use client';

const KEY = 'iiiaha_cart';

export function getCart() {
  if (typeof window === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function setCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart-change'));
}

export function clearCart() {
  setCart([]);
}

function setById(sets, id) {
  return sets.find((s) => s.id === id);
}

// 장바구니 속 세트들이 커버하는 도서 id 집합
export function coveredBookIds(cart, sets) {
  const ids = new Set();
  for (const item of cart) {
    if (item.type !== 'set') continue;
    const s = setById(sets, item.id);
    if (s) s.bookIds.forEach((id) => ids.add(id));
  }
  return ids;
}

export function addBook(bookId, sets) {
  const cart = getCart();
  if (cart.some((i) => i.type === 'book' && i.id === bookId))
    return { ok: false, reason: '이미 장바구니에 담긴 책입니다.' };
  if (cart.some((i) => i.type === 'set' && i.id === 'set-all'))
    return { ok: false, reason: '전체 세트가 장바구니에 있어 개별 도서를 담을 수 없습니다.' };
  const covered = coveredBookIds(cart, sets);
  if (covered.has(bookId)) {
    const owner = cart
      .filter((i) => i.type === 'set')
      .map((i) => setById(sets, i.id))
      .find((s) => s && s.bookIds.includes(bookId));
    return { ok: false, reason: `이 책은 장바구니의 "${owner?.title}"에 이미 포함되어 있습니다.` };
  }
  setCart([...cart, { type: 'book', id: bookId }]);
  return { ok: true };
}

export function addSet(setId, sets) {
  const cart = getCart();
  if (cart.some((i) => i.type === 'set' && i.id === setId))
    return { ok: false, reason: '이미 장바구니에 담긴 세트입니다.' };
  if (setId === 'set-all') {
    // 전체 세트는 다른 모든 항목을 대체
    setCart([{ type: 'set', id: 'set-all' }]);
    return { ok: true, replaced: cart.length > 0 };
  }
  if (cart.some((i) => i.type === 'set' && i.id === 'set-all'))
    return { ok: false, reason: '전체 세트가 장바구니에 있어 다른 항목을 담을 수 없습니다.' };
  const s = setById(sets, setId);
  if (!s) return { ok: false, reason: '세트를 찾을 수 없습니다.' };
  // 이 세트에 포함되는 개별 도서는 장바구니에서 제거(세트로 대체)
  const kept = cart.filter((i) => !(i.type === 'book' && s.bookIds.includes(i.id)));
  const removed = cart.length - kept.length;
  setCart([...kept, { type: 'set', id: setId }]);
  return { ok: true, replaced: removed > 0 };
}

export function removeItem(type, id) {
  setCart(getCart().filter((i) => !(i.type === type && i.id === id)));
}
