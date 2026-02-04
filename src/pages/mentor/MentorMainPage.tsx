import {
  BookOpen,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Clock,
  FileText,
  FileUp,
  ListChecks,
  MessageCircle,
  MoreVertical,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { FeedbackWriteModal } from '@/components/mentor/FeedbackWriteModal';
import { UserIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useMentees } from '@/hooks/useMentees';
import { useSubmittedAssignments } from '@/hooks/useSubmittedAssignments';
import { useAuthStore } from '@/stores/useAuthStore';
import type { MenteeSummary, SubmittedAssignment } from '@/types';

const FILTER_TABS = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '과제 대기' },
  { id: 'feedback', label: '피드백 필요' },
] as const;

export function MentorMainPage() {
  const { user } = useAuthStore();
  const [filterTab, setFilterTab] = useState<(typeof FILTER_TABS)[number]['id']>('all');
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [deletedMenteeIds, setDeletedMenteeIds] = useState<Set<string>>(new Set());

  const { data: mentees = [] } = useMentees();
  const { data: submittedAssignments = [] } = useSubmittedAssignments();

  const totalPendingFeedback = mentees.reduce((sum, m) => sum + m.pendingFeedbackCount, 0);
  const weeklyCompleted = 8;

  const filteredMentees = mentees
    .filter((m) => !deletedMenteeIds.has(m.id))
    .filter((mentee) => {
      if (filterTab === 'all') return true;
      if (filterTab === 'pending') return mentee.todaySubmitted < mentee.todayTotal;
      if (filterTab === 'feedback') return mentee.pendingFeedbackCount > 0;
      return true;
    });

  const handleDeleteMentee = (menteeId: string, menteeName: string) => {
    if (window.confirm(`"${menteeName}" 멘티를 삭제하시겠습니까?\n삭제된 멘티는 목록에서 제거됩니다.`)) {
      setDeletedMenteeIds((prev) => new Set(prev).add(menteeId));
      alert('멘티가 삭제되었습니다.');
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* 상단: 다크 헤더 (환영 메시지 + 요약 카드) */}
      <section className="flex flex-col gap-4 rounded-xl bg-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white sm:text-lg">
            안녕하세요, {user?.name ?? '멘토'}님! 👋
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            오늘도 멘티들의 성장을 함께 만들어가요
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <SummaryCard label="담당 멘티" value={`${mentees.length}명`} />
          <SummaryCard label="대기 중인 피드백" value={`${totalPendingFeedback}개`} />
          <SummaryCard label="이번 주 완료 과제" value={`${weeklyCompleted}개`} />
        </div>
      </section>

      {/* 퀵버튼 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">빠른 작업</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to={`/mentor/mentees/${mentees[0]?.id}/assignments/new`}>
            <QuickActionCard
              icon={<Plus className="h-8 w-8" />}
              title="새 과제 등록"
              description="멘티에게 과제 부여하기"
            />
          </Link>
          <button
            type="button"
            onClick={() => setFeedbackModalOpen(true)}
            className="w-full text-left"
          >
            <QuickActionCard
              icon={<FileUp className="h-8 w-8" />}
              title="피드백 작성"
              description="제출된 과제 검토하기"
            />
          </button>
        </div>
      </section>

      {/* 담당 멘티 현황 */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h3 className="text-base font-bold text-slate-800 sm:text-lg">담당 멘티 현황</h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {filteredMentees.map((mentee) => (
            <MenteeCard
              key={mentee.id}
              mentee={mentee}
              recentAssignments={submittedAssignments.filter((a) => a.menteeId === mentee.id)}
              onDelete={() => handleDeleteMentee(mentee.id, mentee.name)}
            />
          ))}
        </div>
      </section>

      <FeedbackWriteModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-700/80 px-3 py-2 sm:px-4 sm:py-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-white sm:mt-1 sm:text-xl">{value}</p>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:shadow-sm sm:gap-4 sm:p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 sm:h-14 sm:w-14">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function RecentAssignmentItem({
  assignment,
  menteeId,
}: {
  assignment: SubmittedAssignment;
  menteeId: string;
}) {
  const Icon =
    assignment.iconType === 'camera'
      ? Camera
      : assignment.iconType === 'book'
        ? BookOpen
        : FileText;

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-slate-900">{assignment.title}</p>
          <p className="truncate text-xs text-slate-500">{assignment.submittedAt} 제출</p>
        </div>
      </div>
      {assignment.feedbackDone ? (
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          <Check className="h-3.5 w-3.5" />
          피드백 완료
        </span>
      ) : (
        <Link
          to={`/mentor/mentees/${menteeId}/feedback/${assignment.id}`}
          className="shrink-0"
        >
          <Button size="sm" className="whitespace-nowrap">
            피드백 작성하기
          </Button>
        </Link>
      )}
    </div>
  );
}

function MenteeCard({
  mentee,
  recentAssignments,
  onDelete,
}: {
  mentee: MenteeSummary;
  recentAssignments: SubmittedAssignment[];
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const todayProgress =
    mentee.todayTotal > 0 ? (mentee.todaySubmitted / mentee.todayTotal) * 100 : 0;

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      {/* 프로필 헤더 */}
      <div className="flex items-start gap-4">
        <Link
          to={`/mentor/mentees/${mentee.id}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 transition-opacity hover:opacity-80 sm:h-14 sm:w-14"
        >
          <UserIcon className="h-7 w-7 text-slate-500" />
        </Link>
        <Link
          to={`/mentor/mentees/${mentee.id}`}
          className="min-w-0 flex-1 cursor-pointer transition-opacity hover:opacity-80"
        >
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-base font-bold text-slate-900 sm:text-lg">{mentee.name}</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
              {mentee.gradeFull ?? mentee.grade}
            </span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-white">
              활동 중
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {mentee.school} | 희망 전공: {mentee.desiredMajor}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              멘토링 시작: {mentee.mentoringStart}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              최근 활동: {mentee.lastActive}
            </span>
          </div>
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="더보기"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 요약 통계 3개 */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-500">오늘의 과제</span>
          </div>
          <p className="mt-0.5 text-base font-bold text-slate-900 sm:mt-1 sm:text-lg">
            {mentee.todaySubmitted}/{mentee.todayTotal}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-600"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-500">학습 인증</span>
          </div>
          <p className="mt-0.5 text-base font-bold text-slate-900 sm:mt-1 sm:text-lg">
            {mentee.learningCert ?? '-'}
          </p>
          <p className="text-xs text-slate-500">
            {mentee.learningCertUploaded ?? '-'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-500">주간 달성률</span>
          </div>
          <p className="mt-0.5 text-base font-bold text-slate-900 sm:mt-1 sm:text-lg">
            {mentee.weeklyAchievement ?? 0}%
          </p>
          {mentee.weeklyChange != null && (
            <p className="text-xs text-slate-500">
              {mentee.weeklyChange >= 0 ? '↑' : '↓'} 지난주 대비{' '}
              {mentee.weeklyChange >= 0 ? '+' : ''}
              {mentee.weeklyChange}%
            </p>
          )}
        </div>
      </div>

      {/* 최근 제출 과제 */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-800">최근 제출 과제</h4>
          <Link
            to={`/mentor/mentees/${mentee.id}`}
            className="flex items-center gap-0.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            전체 보기
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="min-w-0 space-y-2">
          {(() => {
            const recent = [...recentAssignments]
              .sort((a, b) => (b.submittedAt > a.submittedAt ? 1 : -1))
              .slice(0, 3);
            return recent.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">제출된 과제가 없습니다.</p>
            ) : (
              recent.map((a) => (
                <RecentAssignmentItem key={a.id} assignment={a} menteeId={mentee.id} />
              ))
            );
          })()}
        </div>
      </div>

      {/* 하단 액션 버튼 */}
      <div className="mt-4 flex min-w-0 items-center gap-2">
        <Link
          to={`/mentor/mentees/${mentee.id}/assignments/new`}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="truncate">새 과제 등록</span>
        </Link>
        <Link
          to={`/mentor/mentees/${mentee.id}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50"
          title="채팅/피드백"
        >
          <MessageCircle className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
