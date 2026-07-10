import { getBooks, getSets, getConfig } from '@/lib/data';
import CartView from '@/components/CartView';

export const metadata = { title: '장바구니 — 책장을 정리합니다.' };

export default async function CartPage() {
  const [books, sets, config] = await Promise.all([getBooks(), getSets(), getConfig()]);
  return <CartView books={books} sets={sets} config={config} />;
}
