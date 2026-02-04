export default function AssignmentContent() {
  return (
    <>
      <section>
        <div className="p-5 border bg-slate-50 rounded-xl border-slate-100">
          <h3 className="mb-4 text-sm font-bold text-slate-900">과제 내용</h3>
          <ul className="space-y-4">
            <li className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="select-none text-slate-300">•</span>
              <span>오늘은 과학 지문 3개를 풀어주세요. 시간을 재면서 푸는 것이 중요해요!</span>
            </li>
            <li className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="select-none text-slate-300">•</span>
              <span>틀린 문제는 왜 틀렸는지 반드시 분석해서 노트에 적어주세요.</span>
            </li>
            <li className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="select-none text-slate-300">•</span>
              <span>모르는 어휘는 별도로 정리하면 좋아요. 특히 전문 용어!</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
