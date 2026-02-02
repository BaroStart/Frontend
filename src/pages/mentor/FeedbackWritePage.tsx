import { useParams, Link } from 'react-router-dom';

export function FeedbackWritePage() {
  const { menteeId } = useParams<{ menteeId: string }>();

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          to={`/mentor/mentees/${menteeId}`}
          className="text-slate-500 hover:text-slate-700"
        >
          ← 돌아가기
        </Link>
        <h1 className="text-xl font-bold text-slate-800">피드백 작성</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">제출물</h2>
          <div className="flex min-h-[300px] items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            이미지/PDF 미리보기 영역
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">피드백 입력</h2>
          <p className="mb-4 text-sm text-slate-500">
            과목별 섹션 · 템플릿 가져오기 · 중요 표시(★) · 총평 · 임시저장
          </p>
          <textarea
            placeholder="피드백을 입력하세요..."
            className="block w-full rounded-lg border border-slate-200 p-3"
            rows={6}
          />
        </section>
      </div>
    </div>
  );
}
