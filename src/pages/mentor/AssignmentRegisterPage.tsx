import { useParams, Link } from 'react-router-dom';

export function AssignmentRegisterPage() {
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
        <h1 className="text-xl font-bold text-slate-800">과제 등록</h1>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <p className="mb-4 text-sm text-slate-500">
          날짜 선택 · 과제 정보(학생, 할 일 이름, 목표, 과목, 마감) · 학습 자료 업로드 · 복사 기능
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">날짜</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">과목</label>
            <select className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2">
              <option>국어</option>
              <option>영어</option>
              <option>수학</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
