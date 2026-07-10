export default function Stars({ value }) {
  if (!value) return <span>상태 미입력</span>;
  const n = Math.max(1, Math.min(5, Number(value)));
  return (
    <span aria-label={`상태 ${n}/5`}>
      {'★'.repeat(n)}
      {'☆'.repeat(5 - n)}
    </span>
  );
}
