import { useParams, Link } from 'react-router-dom';

export function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/mentee" className="text-slate-500 hover:text-slate-700">
          ← 돌아가기
        </Link>
        <h1 className="text-lg font-bold text-slate-800">과제 상세</h1>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">학습지</h2>
          <p className="text-sm text-slate-500">PDF 다운로드</p>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">공부 인증</h2>
          <p className="mb-4 text-sm text-slate-500">이미지 업로드</p>
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            업로드 영역 (과제 ID: {assignmentId})
          </div>
        </section>
      </div>
    </div>
  );
}
