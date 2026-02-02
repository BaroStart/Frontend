export function MyPage() {
  return (
    <div className="p-4">
      <h1 className="mb-6 text-lg font-bold text-slate-800">마이페이지</h1>

      <section className="mb-6 rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">학습 현황</h2>
        <p className="text-sm text-slate-500">
          과목별 달성률 · 주간/월간 공부패턴 리포트
        </p>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">상담 받아보기</h2>
        <p className="mb-4 text-sm text-slate-500">외부 폼(Google Forms) 연결</p>
        <button
          type="button"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
        >
          상담 신청
        </button>
      </section>
    </div>
  );
}
