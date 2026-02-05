import { Check, Lightbulb, Pencil, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAssignmentDetail } from '@/hooks/useAssignmentDetail';
import type { AssignmentDetail } from '@/types';

interface AssignmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  source: 'feedback' | 'incomplete';
  feedbackStatus?: 'urgent' | 'pending' | 'partial' | 'completed' | null;
  menteeId?: string;
  fallback?: { title: string; goal?: string; subject?: string };
  overrides?: Partial<AssignmentDetail>;
  onSave?: (data: Partial<AssignmentDetail>) => void;
}

function buildFallbackDetail(
  assignmentId: string,
  fallback: { title: string; goal?: string; subject?: string }
): AssignmentDetail {
  return {
    assignmentId,
    title: fallback.title,
    subject: fallback.subject ?? '과목',
    date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    goal: fallback.goal ?? '-',
    content: '<p>과제 상세 내용이 등록되지 않았습니다.</p>',
    providedPdfs: [],
    studentPhotos: [],
  };
}

export function AssignmentDetailModal({
  isOpen,
  onClose,
  assignmentId,
  source,
  feedbackStatus,
  menteeId,
  fallback,
  overrides,
  onSave,
}: AssignmentDetailModalProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    goal: '',
    content: '',
    contentChecklist: [] as string[],
  });

  const { data: apiDetail, isLoading } = useAssignmentDetail(
    menteeId,
    assignmentId,
    { enabled: isOpen && !!menteeId && !!assignmentId }
  );

  const detail = useMemo((): AssignmentDetail | null => {
    const base = apiDetail ?? (fallback ? buildFallbackDetail(assignmentId, fallback) : null);
    if (!base) return null;
    return { ...base, ...overrides } as AssignmentDetail;
  }, [apiDetail, fallback, assignmentId, overrides]);

  if (!isOpen) return null;
  if (!detail && !isLoading) return null;

  const showLoading = isLoading && !detail;
  const d = detail!; // 렌더 시점에 detail이 있음 (위 early return으로 보장)

  const handleEditClick = () => {
    if (source === 'incomplete' && menteeId) {
      const columnContent =
        d.contentChecklist && d.contentChecklist.length > 0
          ? `<h3>과제 내용</h3>\n<ul>\n${d.contentChecklist.map((item) => `  <li>${item}</li>`).join('\n')}\n</ul>`
          : d.content;
      const subjectMap: Record<string, string> = {
        국어: '국어',
        영어: '영어',
        수학: '수학',
        과학: '수학',
        사회: '국어',
        자기주도: '국어',
      };
      onClose();
      navigate(`/mentor/mentees/${menteeId}/assignments/new`, {
        state: {
          editAssignment: {
            title: d.title,
            goal: d.goal,
            subject: subjectMap[d.subject] ?? '국어',
            columnContent,
          },
        },
      });
      return;
    }
    startEdit();
  };

  const startEdit = () => {
    const checklist = d.contentChecklist ?? [];
    setEditForm({
      title: d.title,
      goal: d.goal,
      content: checklist.length > 0 ? '' : d.content,
      contentChecklist: checklist,
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveEdit = () => {
    const filteredChecklist = editForm.contentChecklist.filter((s) => s.trim());
    const data: Partial<AssignmentDetail> = {
      title: editForm.title,
      goal: editForm.goal,
      content: filteredChecklist.length > 0 ? '' : editForm.content,
      contentChecklist:
        filteredChecklist.length > 0 ? filteredChecklist : undefined,
    };
    onSave?.(data);
    setIsEditing(false);
  };

  const addChecklistItem = () => {
    setEditForm((prev) => ({
      ...prev,
      contentChecklist: [...prev.contentChecklist, ''],
    }));
  };

  const updateChecklistItem = (index: number, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      contentChecklist: prev.contentChecklist.map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeChecklistItem = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      contentChecklist: prev.contentChecklist.filter((_, i) => i !== index),
    }));
  };

  const isCompleted = source === 'feedback';
  const showFullDetail = isCompleted; // 완료: 전체 디자인, 미완료: 과제 내용만

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {showLoading ? (
          <>
            <div className="absolute right-4 top-4 z-10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center p-12">
              <p className="text-sm text-slate-500">과제 정보를 불러오는 중...</p>
            </div>
          </>
        ) : (
          <>
        {/* 헤더: 수정/닫기 */}
        <div className="absolute right-4 top-4 z-10 flex gap-1">
          {!isEditing && (onSave || (source === 'incomplete' && menteeId)) && (
            <button
              type="button"
              onClick={handleEditClick}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            >
              <Pencil className="h-4 w-4" />
              수정
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 상단: 과목 태그, 날짜, 제목, 목표 */}
          <div className="border-b border-slate-100 bg-white p-5 pb-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-white">
                {d.subject}
              </span>
              <span className="text-sm text-slate-500">{d.date}</span>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  id="edit-title"
                  label="제목"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                />
                <Input
                  id="edit-goal"
                  label="목표"
                  value={editForm.goal}
                  onChange={(e) => setEditForm((p) => ({ ...p, goal: e.target.value }))}
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900">{d.title}</h2>
                <p className="mt-2 text-sm text-slate-600">목표: {d.goal}</p>
              </>
            )}
          </div>

          {/* 완료된 과제만 탭 표시 */}
          {showFullDetail && !isEditing && (
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                className="border-b-2 border-slate-800 px-6 py-3 text-sm font-medium text-slate-900"
              >
                과제 정보
              </button>
              <button
                type="button"
                className="border-b-2 border-transparent px-6 py-3 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                피드백
              </button>
            </div>
          )}

          <div className="space-y-4 p-5">
            {/* 과제 내용 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">과제 내용</h3>
              {isEditing ? (
                <div className="space-y-3">
                  {editForm.contentChecklist.length > 0 ? (
                    <div className="space-y-2">
                      {editForm.contentChecklist.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={(e) => updateChecklistItem(i, e.target.value)}
                            placeholder={`항목 ${i + 1}`}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(i)}
                            className="rounded p-2 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                          항목 추가
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditForm((p) => ({
                              ...p,
                              content: p.contentChecklist.join('\n'),
                              contentChecklist: [],
                            }))
                          }
                        >
                          텍스트로 전환
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={editForm.content}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, content: e.target.value }))
                        }
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="과제 내용을 입력하세요"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditForm((p) => ({
                            ...p,
                            content: '',
                            contentChecklist: [''],
                          }))
                        }
                      >
                        체크리스트로 전환
                      </Button>
                    </>
                  )}
                </div>
              ) : d.contentChecklist && d.contentChecklist.length > 0 ? (
                <ul className="space-y-2">
                  {d.contentChecklist.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  className="prose prose-sm max-w-none text-slate-700 prose-p:my-1 prose-ul:my-2"
                  dangerouslySetInnerHTML={{ __html: d.content }}
                />
              )}
            </div>

            {/* 미완료 과제: 과제 내용만 표시, 이하 생략 */}
            {showFullDetail && !isEditing && (
              <>
                {/* 관련 자료 태그 */}
                {d.relatedResources && d.relatedResources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {d.relatedResources.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* 설스터디 칼럼 */}
                {d.studyColumn && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-semibold text-slate-800">
                        {d.studyColumn.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600">{d.studyColumn.content}</p>
                    {d.studyColumn.readMoreLink && (
                      <a
                        href={d.studyColumn.readMoreLink}
                        className="mt-2 inline-block text-sm text-slate-600 underline hover:text-slate-800"
                      >
                        전체 읽기
                      </a>
                    )}
                  </div>
                )}

                {/* 학생 제출 사진 */}
                {d.studentPhotos.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">학생 제출 사진</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {d.studentPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption ?? '제출 사진'}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 메모 */}
                {d.studentMemo && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">메모</h3>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm text-slate-600">{d.studentMemo}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-2 border-t border-slate-200 p-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={cancelEdit} className="flex-1">
                취소
              </Button>
              <Button onClick={saveEdit} className="flex-1">
                저장
              </Button>
            </>
          ) : isCompleted ? (
            feedbackStatus === 'completed' ? (
              <Link
                to={`/mentor/mentees/${menteeId}/feedback/${assignmentId}`}
                className="w-full"
              >
                <Button variant="outline" className="w-full" onClick={onClose}>
                  전체 피드백 보기
                </Button>
              </Link>
            ) : menteeId ? (
              <Link
                to={`/mentor/mentees/${menteeId}/feedback/${assignmentId}`}
                className="w-full"
              >
                <Button className="w-full" onClick={onClose}>
                  피드백 작성하기
                </Button>
              </Link>
            ) : (
              <Button className="w-full" onClick={onClose}>
                닫기
              </Button>
            )
          ) : (
            <Button className="w-full" onClick={onClose}>
              닫기
            </Button>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
