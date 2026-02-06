import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';

import { WeeklyStudyStatusCard } from '@/components/mentee/my/WeeklyStudyStatusCard';
import { SubjectAchievementSection } from '@/components/mentee/my/SubjectAchievementSection';
import { MonthlyStudyCalendar } from '@/components/mentee/my/MonthlyStudyCalendar';
import { BadgeSection } from '@/components/mentee/my/BadgeSection';
import { ConsultButton } from '@/components/mentee/my/ConsultButton';

export function MyPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const user = useMemo(
    () => ({
      name: '김민지',
      avatarUrl: '', 
      weekProgressPercent: 80,
      totalStudyText: '24시간 30분',
      completedText: '44/55',
      quote: '노력은 배신하지 않는다\n오늘도 한 걸음 더 나아가는 당신을 응원합니다!',
    }),
    []
  );

  const subjects = useMemo(
    () => [
      {
        id: 'kor',
        name: '국어',
        percent: 92,
        weekTotalText: '주간 목표: 12시간',
        weekDoneText: '11.2h / 12h',
        breakdown: [
          { label: '비문학', valueText: '6.5h' },
          { label: '문학', valueText: '3.2h' },
          { label: '문법', valueText: '1.5h' },
        ],
      },
      {
        id: 'eng',
        name: '영어',
        percent: 78,
        weekTotalText: '주간 목표: 15시간',
        weekDoneText: '11.7h / 15h',
        breakdown: [
          { label: '독해', valueText: '7.2h' },
          { label: '단어', valueText: '2.8h' },
          { label: '어법', valueText: '1.7h' },
        ],
      },
      {
        id: 'math',
        name: '수학',
        percent: 65,
        weekTotalText: '주간 목표: 18시간',
        weekDoneText: '11.7h / 18h',
        breakdown: [
          { label: '개념', valueText: '5.5h' },
          { label: '오답노트', valueText: '4.2h' },
          { label: '확통', valueText: '2.0h' },
        ],
      },
    ],
    []
  );

  const badges = useMemo(
    () => [
      { id: 'b1', title: '7일 연속', subtitle: '출석', icon: '🔥', acquired: true },
      { id: 'b2', title: '주간목표', subtitle: '달성', icon: '🏆', acquired: true },
      { id: 'b3', title: '첫 과제', subtitle: '완료', icon: '⭐', acquired: true },
      { id: 'b4', title: '100시간', subtitle: '학습', icon: '🕒', acquired: true },
      { id: 'b5', title: '국어', subtitle: '마스터', icon: '📚', acquired: false },
      { id: 'b6', title: '성공', subtitle: '플래너', icon: '📈', acquired: false },
      { id: 'b7', title: '30일 연속', subtitle: '출석', icon: '🗓️', acquired: false },
      { id: 'b8', title: '500시간', subtitle: '학습', icon: '⏳', acquired: false },
    ],
    []
  );

  return (
    <div className="relative px-4 pt-4 pb-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">안녕하세요</p>
          <h1 className="text-lg font-semibold text-gray-900">{user.name}님</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      <WeeklyStudyStatusCard
        title="이번주 학습 현황"
        percent={user.weekProgressPercent}
        totalStudyText={user.totalStudyText}
        completedText={user.completedText}
      />

      <div className="mt-4 rounded-2xl bg-gray-900 px-5 py-5 text-white shadow-sm ">
        <div className="mb-2 text-3xl leading-none opacity-40">“</div>
        <p className="whitespace-pre-line text-base font-extrabold leading-7 text-center">{user.quote}</p>
        <div className="mt-2 text-3xl leading-none text-right opacity-40">”</div>
      </div>

      <SubjectAchievementSection className="mt-6" title="과목별 달성률" items={subjects} />

      <MonthlyStudyCalendar className="mt-6" />

      <BadgeSection className="mt-6" title="획득한 배지" items={badges} onClickAll={() => {}} />

      <div className="mt-6">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
      <ConsultButton formUrl="https://forms.gle/FchKdDcm23JdGHpK9" />
    </div>
  );
}
