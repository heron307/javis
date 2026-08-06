/** 목록 평점 옆 방문 토글 — 구글맵 스타일 깃발 (원형 없음) */
export function VisitMarkIcon({ visited }: { visited: boolean }) {
  return (
    <svg
      className="geo-visit-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden
    >
      {/* 깃대 */}
      <path
        d="M6 3.5v17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* 깃발 (오른쪽 V 노치) */}
      <path
        d="M7.1 4h11.2l-3.1 4.6 3.1 4.6H7.1V4z"
        fill={visited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
