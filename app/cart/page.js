import { getBooks, getSets, getConfig } from '@/lib/data';
import CartView from '@/components/CartView';

export const metadata = { title: '장바구니 — iiiaha books' };

export default async function CartPage() {
  const [books, sets, config] = await Promise.all([getBooks(), getSets(), getConfig()]);
  return <CartView books={books} sets={sets} config={config} />;
}
