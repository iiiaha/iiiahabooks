import { unstable_cache } from 'next/cache';
import { readJson } from './store';

// 공개 페이지용 데이터 읽기.
// 'sitedata' 태그로 캐시하고, 관리자 저장 시 revalidateTag로 즉시 비운다 → 재배포 없이 반영.
function cachedRead(name) {
  return unstable_cache(() => readJson(name), ['data', name], {
    tags: ['sitedata'],
    revalidate: 300,
  })();
}

export const getBooks = () => cachedRead('books.json');
export const getSets = () => cachedRead('sets.json');
export const getConfig = () => cachedRead('config.json');
