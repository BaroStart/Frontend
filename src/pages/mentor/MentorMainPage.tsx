import { Link } from 'react-router-dom';

// MVP: 멘티 2명 고정
const MENTEES = [
  { id: 's1', name: '멘티1', school: 'OO고', progress: 75 },
  { id: 's2', name: '멘티2', school: 'OO고', progress: 60 },
];

export function MentorMainPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-800">담당 학생</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {MENTEES.map((mentee) => (
          <Link
            key={mentee.id}
            to={`/mentor/mentees/${mentee.id}`}
            className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">{mentee.name}</h2>
              <span className="text-sm text-slate-500">{mentee.school}</span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${mentee.progress}%` }}
              />
            </div>
            <div className="flex gap-2">
              <span className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-800">
                피드백 쓰기
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                과제 등록
              </span>
            </div>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold text-slate-800">학습 현황 요약</h2>
        <p className="text-sm text-slate-500">
          오늘 과제 제출 여부 · 미확인 과제 수 · 피드백 미작성 표시 (추후 구현)
        </p>
      </section>
    </div>
  );
}
