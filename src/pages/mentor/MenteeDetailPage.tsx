import { Link, useParams } from 'react-router-dom';

export function MenteeDetailPage() {
  const { menteeId } = useParams<{ menteeId: string }>();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">멘티 상세</h1>
        <Link
          to={`/mentor/mentees/${menteeId}/assignments/new`}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          과제 등록
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">달력</h2>
          <p className="text-sm text-slate-500">날짜 선택 · 해당 날짜 할 일/과제/코멘트/질문 확인</p>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">피드백 대시보드</h2>
          <p className="mb-4 text-sm text-slate-500">미작성 과제 목록 · 피드백 작성 버튼</p>
          <Link
            to={`/mentor/mentees/${menteeId}/feedback/1`}
            className="inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            피드백 작성
          </Link>
        </section>
      </div>
    </div>
  );
}
