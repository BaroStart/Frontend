import { type ChangeEvent, useRef, useState } from 'react';

import { Camera, CheckCircle2, ImageIcon, Info, PenTool, X } from 'lucide-react';
import type { AssignmentDetail } from '@/types';

export default function StudyVerification({
  assignment,
  detail,
}: {
  assignment: Assignment;
  detail: AssignmentDetail | null;
}) {
  const isCompleted = assignment.status === '완료'; //과제 제출 완료 여부
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const isEditing = false; //임시
  // const [isEditing, setIsEditing] = useState(false); // 수정 모드 여부
  const [previewImages, setPreviewImages] = useState<{ id: string; url: string; file: File }[]>([]);
  const submittedPhotos = detail?.studentPhotos ?? [];

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };
  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  // 공통 파일 처리 함수 (둘 다 여기로 연결)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 여러 파일 처리 (FileList는 배열이 아니라서 Array.from 사용)
    const newPhotos = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file), // 미리보기 URL 생성
      name: file.name,
      file: file,
    }));

    setPreviewImages((prev) => [...prev, ...newPhotos]);

    // 같은 파일을 다시 선택할 수도 있으니 input 초기화
    e.target.value = '';
  };

  return (
    <>
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-4 h-4 text-slate-900" />
          <h3 className="text-sm font-bold text-slate-900">
            {isCompleted ? '제출 내역' : '공부 인증'}
          </h3>
        </div>

        {/* 제출 전이거나 수정 중 */}
        {(!isCompleted || isEditing) && (
          <>
            {/* 인증 가이드 */}
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

            {/* 사진 첨부 버튼*/}
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-3">
                {/* 카메라로 찍기 */}
                <button
                  className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-[#0E9ABE] hover:text-[#0E9ABE] transition-all bg-white"
                  onClick={handleCameraClick}
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-[#0E9ABE]/10">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">카메라로 찍기</span>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment" // 모바일 후면 카메라 자동 실행
                  className="hidden"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                />
                {/* 갤러리 선택 */}
                <button
                  className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-[#0E9ABE] hover:text-[#0E9ABE] transition-all bg-white"
                  onClick={handleGalleryClick}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">갤러리 선택</span>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  multiple // 여러장 선택 허용
                  className="hidden"
                  ref={galleryInputRef}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </>
        )}

        {/* 첨부한 사진 없을 때 */}
        {previewImages.length === 0 && submittedPhotos.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 mb-6 text-center border border-dashed rounded-xl border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-center w-12 h-12 mb-3 bg-white rounded-full shadow-sm text-slate-300">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-500">
              아직 첨부된 사진이 없어요.
              <br />위 버튼을 눌러 공부한 내용을 인증해주세요!
            </p>
          </div>
        )}

        {/* (mock) 제출된 사진이 있을 때 */}
        {submittedPhotos.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="flex items-center gap-1 text-xs font-medium text-slate-900">
                <ImageIcon className="w-3.5 h-3.5" />
                제출된 사진 ({submittedPhotos.length})
              </h4>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [&::-webkit-scrollbar]:hidden">
              {submittedPhotos.map((p, i) => (
                <div
                  key={p.id}
                  className="relative flex-shrink-0 overflow-hidden border w-28 aspect-square bg-slate-100 rounded-xl group border-slate-100"
                >
                  <img src={p.url} alt={p.caption ?? `제출 사진 ${i + 1}`} className="object-cover w-full h-full" />
                  <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                    {i + 1}/{submittedPhotos.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 새로 첨부한 사진이 있을 때 */}
        {previewImages && previewImages.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="flex items-center gap-1 text-xs font-medium text-slate-900">
                <ImageIcon className="w-3.5 h-3.5" />
                첨부된 사진 ({previewImages.length})
              </h4>
              {!isCompleted && (
                <button
                  onClick={() => setPreviewImages([])}
                  className="text-xs underline text-slate-500 decoration-slate-300 hover:text-slate-900"
                >
                  전체 삭제
                </button>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [&::-webkit-scrollbar]:hidden">
              {previewImages.map((Image, i) => (
                <div
                  key={Image.id}
                  className="relative flex-shrink-0 overflow-hidden border w-28 aspect-square bg-slate-100 rounded-xl group border-slate-100"
                >
                  <img
                    src={Image.url}
                    alt={Image.file.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 transition-opacity opacity-0 bg-black/20 group-hover:opacity-100" />
                  {!isCompleted && (
                    <button
                      onClick={() =>
                        setPreviewImages((prevImages) =>
                          prevImages.filter((img) => img.id !== Image.id),
                        )
                      }
                      className="absolute flex items-center justify-center w-6 h-6 transition-opacity bg-white rounded-full shadow-sm opacity-0 top-2 right-2 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5 text-slate-900" />
                    </button>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                    {i + 1}/{previewImages.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 제출 완료 시간 */}
        {isCompleted && (
          <div className="flex items-center gap-2 p-3 mb-8 border bg-slate-50 border-slate-100 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-slate-900" />
            <span className="text-xs font-medium text-slate-700">
              {assignment.submissionDate} 제출 완료
            </span>
          </div>
        )}

        {/*메모 */}
        {isCompleted || isEditing ? (
          <>
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
