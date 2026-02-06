// --- Types ---
interface FeedbackProps {
  mentorName?: string;
  mentorAvatar?: string;
  feedbackTime?: string;
  summary?: string;
  detail?: string;
}

// --- Mock Data ---
const MOCK_FEEDBACK = {
  mentorName: '김민준 멘토',
  mentorAvatar:
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200',
  feedbackTime: '4시간 전',
  summary: '영어 독해에서 주제문 찾기가 아직 어려워 보이네요. 내일 추가 자료를 드릴게요.',
  detail: `이차방정식은 고등 수학의 기초가 되는 중요한 단원이에요! 근의 공식을 단순히 외우기보다는 유도 과정을 이해하면 나중에 더 어려운 문제도 쉽게 풀 수 있답니다. 💪\n\n문제 풀이할 때는 계산 실수를 줄이기 위해 중간 과정을 꼭 적어주세요. 틀린 문제는 왜 틀렸는지 분석하는 게 가장 중요해요!\n\n화이팅! 😄`,
};

export default function AssignmentFeedback(props: FeedbackProps) {
  const {
    mentorName = MOCK_FEEDBACK.mentorName,
    mentorAvatar = MOCK_FEEDBACK.mentorAvatar,
    feedbackTime = MOCK_FEEDBACK.feedbackTime,
    summary = MOCK_FEEDBACK.summary,
    detail = MOCK_FEEDBACK.detail,
  } = props;

  return (
    <div className="px-6 py-6 space-y-8">
      {/* 피드백 요약 */}
      <section>
        <h3 className="mb-4 text-sm font-bold text-slate-900">피드백 요약</h3>
        <div className="p-5 bg-white border shadow-sm rounded-2xl text-slate-950">
          <div className="flex items-start gap-4">
            {/* 프로필 */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 overflow-hidden border rounded-full border-slate-100 bg-slate-100">
                <img src={mentorAvatar} alt={mentorName} className="object-cover w-full h-full" />
              </div>
            </div>

            {/* 코멘트 */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-900">{mentorName}</span>
                <span className="text-xs font-medium text-slate-400">{feedbackTime}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-600 break-keep">
                {summary}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 상세 피드백 섹션 */}
      <section>
        <h3 className="mb-4 text-sm font-bold text-slate-900">피드백</h3>
        <div className="relative p-6 bg-slate-50 rounded-xl pl-7">
          <div className="absolute left-0 w-1 rounded-r-full top-6 bottom-6 bg-slate-900" />

          <div className="text-sm font-medium leading-7 whitespace-pre-wrap text-slate-700 break-keep">
            {detail}
          </div>
        </div>
      </section>
    </div>
  );
}