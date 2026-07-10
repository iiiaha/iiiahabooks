import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500'] });

export const metadata = {
  title: '책장을 정리합니다. — 건축·인테리어 서적 중고 판매',
  description:
    '건축·인테리어 관련 서적 53권 중고 판매. GARM 매거진, 애뉴얼 인테리어 디테일, 단행본.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="wrap">
          <Header />
          {children}
          <footer className="footer">
            책장을 정리합니다. — 신청 마감 후 우선순위에 따라 연락드립니다 · 계좌이체 직거래
          </footer>
        </div>
      </body>
    </html>
  );
}
