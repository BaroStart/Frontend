import { Link } from 'react-router-dom';

export function FeedbackDetailPage() {
  return (
    <div className="p-4">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/mentee" className="text-slate-500 hover:text-slate-700">
          ← 돌아가기
        </Link>
        <h1 className="text-lg font-bold text-slate-800">피드백 상세</h1>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">데일리 피드백 요약</h2>
          <p className="text-sm text-slate-600">중요 표시된 피드백 최상단 강조</p>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">과목별 피드백</h2>
          <p className="text-sm text-slate-500">국/영/수 필터 · 과제별 피드백 확인</p>
        </section>
      </div>
    </div>
  );
}
