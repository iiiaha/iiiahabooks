import Link from 'next/link';
import { notFound } from 'next/navigation';
import books from '@/data/books.json';
import sets from '@/data/sets.json';
import Stars from '@/components/Stars';
import AddToCart from '@/components/AddToCart';
import { won } from '@/lib/format';

export function generateStaticParams() {
  return books.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  return { title: book ? `${book.title} — iiiaha books` : 'iiiaha books' };
}

export default async function BookPage({ params }) {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  if (!book) notFound();

  const rows = [
    ['글쓴이', book.author || '—'],
    ['출판사', book.publisher || '—'],
    ['페이지수', book.pages ? `${book.pages}쪽` : '—'],
    ['정가', won(book.listPrice) ?? '—'],
    ['알라딘 중고시세', book.usedPriceNote || '—'],
    ['ISBN', book.isbn || '—'],
  ];

  return (
    <div className="detail">
      <div className="photo">
        <img src={book.image} alt={book.title} />
      </div>
      <div>
        <h1>{book.title}</h1>
        <div className="info">
          <div className="row">
            <span className="k">판매 가격</span>
            <span className="saleprice">{won(book.salePrice) ?? '가격 미정'}</span>
          </div>
          <div className="row">
            <span className="k">책 상태</span>
            <span>
              <Stars value={book.condition} />
            </span>
          </div>
          {rows.map(([k, v]) => (
            <div className="row" key={k}>
              <span className="k">{k}</span>
              <span>{v}</span>
            </div>
          ))}
          {book.note && (
            <div className="row">
              <span className="k">비고</span>
              <span>{book.note}</span>
            </div>
          )}
        </div>

        <div className="btnrow">
          {book.kyoboUrl && (
            <a className="btn ghost" href={book.kyoboUrl} target="_blank" rel="noreferrer">
              교보문고에서 자세히 보기 ↗
            </a>
          )}
          {book.aladinUsedUrl && (
            <a className="btn ghost" href={book.aladinUsedUrl} target="_blank" rel="noreferrer">
              알라딘 중고 시세 확인 ↗
            </a>
          )}
        </div>

        <div className="btnrow">
          <AddToCart book={book} sets={sets} />
        </div>

        <Link href="/" className="backlink">
          ← 전체 도서로 돌아가기
        </Link>
      </div>
    </div>
  );
}
