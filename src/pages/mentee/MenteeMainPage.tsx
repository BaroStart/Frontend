export function MenteeMainPage() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold text-slate-800">일일 플래너</h1>

      {/* 상단 캘린더 */}
      <section className="mb-6 rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">캘린더</h2>
        <p className="text-sm text-slate-500">
          현재 날짜 · 주간 미니 캘린더 · 월간 확장
        </p>
      </section>

      {/* 일일 피드백 요약 */}
      <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold text-amber-800">
          오늘의 피드백 🚩
        </h2>
        <p className="text-sm text-slate-600">
          멘토 총평 · 핵심 체크(★) · 상세 피드백 보러가기
        </p>
      </section>

      {/* 코멘트/질문 */}
      <section className="mb-6 rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">오늘의 질문</h2>
        <textarea
          placeholder="멘토에게 질문하거나 코멘트를 남겨보세요"
          className="block w-full rounded-lg border border-slate-200 p-3 text-sm"
          rows={2}
        />
      </section>

      {/* 할일 목록 */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">할일 목록</h2>
        <p className="text-sm text-slate-500">
          과제(멘토) · 내 할 일 · 공부 시간 기록
        </p>
      </section>
    </div>
  );
}
