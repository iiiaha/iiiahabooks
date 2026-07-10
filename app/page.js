import books from '@/data/books.json';
import sets from '@/data/sets.json';
import config from '@/data/config.json';
import Shop from '@/components/Shop';

export default function Home() {
  return <Shop books={books} sets={sets} config={config} />;
}
