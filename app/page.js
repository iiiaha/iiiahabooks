import { getBooks, getSets, getConfig } from '@/lib/data';
import Shop from '@/components/Shop';

export default async function Home() {
  const [books, sets, config] = await Promise.all([getBooks(), getSets(), getConfig()]);
  return <Shop books={books} sets={sets} config={config} />;
}
