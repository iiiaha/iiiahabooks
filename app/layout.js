import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'iiiaha books — 건축·인테리어 서적 중고 판매',
  description:
    '건축·인테리어 관련 서적 53권 중고 판매. GARM 매거진, 애뉴얼 인테리어 디테일, 단행본.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="wrap">
          <Header />
          {children}
          <footer className="footer">
            iiiaha books — 거래 신청 후 선정되신 분께 개별 연락드립니다 · 계좌이체 직거래
          </footer>
        </div>
      </body>
    </html>
  );
}
