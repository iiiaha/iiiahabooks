export function won(n) {
  if (n === null || n === undefined || n === '') return null;
  return `${Number(n).toLocaleString('ko-KR')}원`;
}

// datetime-local 값("YYYY-MM-DDTHH:mm")을 KST 기준으로 해석
export function deadlineDate(deadline) {
  if (!deadline) return null;
  const d = new Date(`${deadline}:00+09:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function deadlinePassed(deadline) {
  const d = deadlineDate(deadline);
  return d ? Date.now() > d.getTime() : false;
}

export function deadlineLabel(deadline) {
  if (!deadline) return null;
  return `${deadline.replace('T', ' ')} (한국 시간)`;
}
