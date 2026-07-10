import books from '@/data/books.json';
import sets from '@/data/sets.json';
import config from '@/data/config.json';
import CartView from '@/components/CartView';

export const metadata = { title: '장바구니 — iiiaha books' };

export default function CartPage() {
  return <CartView books={books} sets={sets} config={config} />;
}
