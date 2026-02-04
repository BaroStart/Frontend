import { Camera, CheckCircle2, ImageIcon, Info, PenTool, X } from 'lucide-react';
// Dummy Images
const submittedPhotos = [
  {
    id: 1,
    name: '문제 풀이 1',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 2,
    name: '문제 풀이 2',
    url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 3,
    name: '오답 노트',
    url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 4,
    name: '문제 풀이 1',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 5,
    name: '문제 풀이 2',
    url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 6,
    name: '오답 노트',
    url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=200',
  },
];

export default function StudyVerification({ assignment }: { assignment: Assignment }) {
  const isCompleted = assignment.status === '완료';
  return (
    <>
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-4 h-4 text-slate-900" />
          <h3 className="text-sm font-bold text-slate-900">
            {isCompleted ? '제출 내역' : '공부 인증'}
          </h3>
        </div>

        {!isCompleted && (
          <>
            <div className="p-4 mb-6 bg-slate-50 rounded-xl">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-bold text-slate-700">인증 가이드:</span> 노트와 문제 풀이를
                  선명하게 촬영해주세요. 여러 장을 나눠 찍어도 좋습니다.
                  <br />
                  마감일이 지나도 소급 제출 가능합니다! 😄
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="grid grid-cols-2 gap-3">
                {/* 카메라로 찍기 */}
                <button className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-[#0E9ABE] hover:text-[#0E9ABE] transition-all bg-white">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-[#0E9ABE]/10">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">카메라로 찍기</span>
                </button>
                {/* 갤러리 선택 */}
                <button className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-[#0E9ABE] hover:text-[#0E9ABE] transition-all bg-white">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">갤러리 선택</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* 제출한 사진 (공통 표시, 버튼 노출 여부 다름) */}
        {(isCompleted || submittedPhotos.length > 0) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="flex items-center gap-1 text-xs font-medium text-slate-900">
                <ImageIcon className="w-3.5 h-3.5" />
                {isCompleted ? '제출된 사진' : '첨부된 사진'} ({submittedPhotos.length})
              </h4>
              {!isCompleted && (
                <button className="text-xs underline text-slate-500 decoration-slate-300 hover:text-slate-900">
                  전체 삭제
                </button>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [&::-webkit-scrollbar]:hidden">
              {submittedPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="relative flex-shrink-0 overflow-hidden border w-28 aspect-square bg-slate-100 rounded-xl group border-slate-100"
                >
                  <img src={photo.url} alt={photo.name} className="object-cover w-full h-full" />
                  <div className="absolute inset-0 transition-opacity opacity-0 bg-black/20 group-hover:opacity-100" />
                  {!isCompleted && (
                    <button className="absolute flex items-center justify-center w-6 h-6 transition-opacity bg-white rounded-full shadow-sm opacity-0 top-2 right-2 group-hover:opacity-100">
                      <X className="w-3.5 h-3.5 text-slate-900" />
                    </button>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                    {i + 1}/{submittedPhotos.length}
                  </div>
                  {isCompleted && (
                    <div className="absolute bottom-2 right-2 text-white text-[10px] font-bold drop-shadow-md">
                      {photo.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 완료 상태: 제출 정보 및 읽기 전용 메모 */}
        {isCompleted ? (
          <>
            <div className="flex items-center gap-2 p-3 mb-8 border bg-slate-50 border-slate-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-slate-900" />
              <span className="text-xs font-medium text-slate-700">
                {assignment.submissionDate} 제출 완료
              </span>
            </div>

            <div className="mb-4">
              <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-900">
                <PenTool className="w-3.5 h-3.5" />
                메모
              </h4>
              <div className="w-full h-auto p-4 text-xs leading-relaxed border rounded-xl border-slate-200 bg-slate-50 text-slate-600">
                과제를 하면서 어려웠던 점이나 질문할 내용을 자유롭게 적어주세요. (작성된 내용이
                여기에 표시됩니다.)
              </div>
            </div>
          </>
        ) : (
          /* 미완료 상태: 작성 가능한 메모 */
          <div className="mb-4">
            <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-900">
              <PenTool className="w-3.5 h-3.5" />
              메모 (선택)
            </h4>
            <textarea
              className="w-full h-24 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed focus:outline-none focus:border-[#0E9ABE] focus:ring-1 focus:ring-[#0E9ABE] resize-none"
              placeholder="과제를 하면서 어려웠던 점이나 질문할 내용을 자유롭게 적어주세요."
            ></textarea>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">0 / 500자</span>
              <button className="text-xs font-bold underline text-slate-900 decoration-slate-300">
                임시저장
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
