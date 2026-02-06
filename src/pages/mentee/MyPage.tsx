import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_CONFIG } from '@/api/config';
import { logout as logoutApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { uploadFileViaPreAuthenticatedUrl } from '@/lib/storageUpload';

import { WeeklyStudyStatusCard } from '@/components/mentee/my/WeeklyStudyStatusCard';
import { SubjectAchievementSection } from '@/components/mentee/my/SubjectAchievementSection';
import { MonthlyStudyCalendar } from '@/components/mentee/my/MonthlyStudyCalendar';
import { BadgeSection } from '@/components/mentee/my/BadgeSection';
import { ConsultButton } from '@/components/mentee/my/ConsultButton';

export function MyPage() {
  const navigate = useNavigate();
  const { logout, user: authUser, setProfileImage } = useAuthStore();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const dailyQuote = useMemo(() => {
    // "매일 바뀌는 멘트" (로컬 날짜 기준, 하루 동안은 고정)
    const quotes = [
      '노력은 배신하지 않는다\n오늘도 한 걸음 더 나아가는 당신을 응원합니다!',
      '완벽보다 꾸준함이 더 강합니다.\n오늘도 해냈어요.',
      '작은 습관이 큰 변화를 만듭니다.\n지금의 한 페이지를 쌓아가요.',
      '어제보다 1%만 더.\n그게 결국 가장 큰 차이입니다.',
      '멈추지 않으면 결국 도착합니다.\n오늘도 천천히, 하지만 확실하게.',
      '실수는 성장의 증거.\n오늘 배운 걸 내일의 나에게 선물하세요.',
      '지금의 집중이 미래를 바꿉니다.\n응원할게요!',
    ] as const;

    const now = new Date();
    // local date seed (YYYYMMDD) → stable per day
    const seed =
      now.getFullYear() * 10000 +
      (now.getMonth() + 1) * 100 +
      now.getDate();
    return quotes[seed % quotes.length];
  }, []);

  const handleLogout = async () => {
    try {
      if (!API_CONFIG.useMock) {
        await logoutApi();
      }
    } catch {
      // ignore
    } finally {
      logout();
      navigate('/login');
    }
  };

  const summary = useMemo(
    () => ({
      weekProgressPercent: 80,
      totalStudyText: '24시간 30분',
      completedText: '44/55',
      quote: dailyQuote,
    }),
    [dailyQuote]
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
      { id: 'b1', title: '7일 연속', subtitle: '출석', acquired: true },
      { id: 'b2', title: '주간목표', subtitle: '달성', acquired: true },
      { id: 'b3', title: '첫 과제', subtitle: '완료', acquired: true },
      { id: 'b4', title: '100시간', subtitle: '학습', acquired: true },
      { id: 'b5', title: '국어', subtitle: '마스터', acquired: false },
      { id: 'b6', title: '성공', subtitle: '플래너', acquired: false },
      { id: 'b7', title: '30일 연속', subtitle: '출석', acquired: false },
      { id: 'b8', title: '500시간', subtitle: '학습', acquired: false },
    ],
    []
  );

  return (
    <div className="relative px-4 pt-4 pb-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">안녕하세요</p>
          <h1 className="text-lg font-semibold text-gray-900">{authUser?.name ?? '멘티'}님</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100">
            {authUser?.profileImage ? (
              <img src={authUser.profileImage} alt="avatar" className="h-full w-full object-cover" />
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
        percent={summary.weekProgressPercent}
        totalStudyText={summary.totalStudyText}
        completedText={summary.completedText}
      />

      <div className="mt-4 rounded-2xl bg-gray-900 px-5 py-5 text-white shadow-sm ">
        <div className="mb-2 text-3xl leading-none opacity-40">“</div>
        <p className="whitespace-pre-line text-base font-extrabold leading-7 text-center">{summary.quote}</p>
        <div className="mt-2 text-3xl leading-none text-right opacity-40">”</div>
      </div>

      <SubjectAchievementSection className="mt-6" title="과목별 달성률" items={subjects} />

      <MonthlyStudyCalendar className="mt-6" />

      <BadgeSection className="mt-6" title="획득한 배지" items={badges} onClickAll={() => {}} />

      <div className="mt-6">
        <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">프로필 사진 변경</p>
          <p className="mt-1 text-xs text-gray-500">사진을 선택해서 프로필 이미지를 업데이트할 수 있어요.</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadError('');
              setUploadSuccess(false);

              // 선택 즉시 로컬 미리보기(업로드 URL은 PUT 전용일 수 있어 <img src>로 깨질 수 있음)
              try {
                if (previewUrlRef.current) {
                  URL.revokeObjectURL(previewUrlRef.current);
                }
                const previewUrl = URL.createObjectURL(file);
                previewUrlRef.current = previewUrl;
                setProfileImage(previewUrl);
              } catch {
                // ignore preview errors
              }

              if (API_CONFIG.useMock) {
                setUploadError('현재 VITE_USE_MOCK=true 입니다. VITE_USE_MOCK=false로 바꾼 뒤 업로드를 시도하세요.');
                e.target.value = '';
                return;
              }

              const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
              const who = authUser?.id ?? 'unknown';
              const fileName = `profile/${who}-${Date.now()}${ext}`;

              setUploading(true);
              try {
                await uploadFileViaPreAuthenticatedUrl({ file, fileName });
                setUploadSuccess(true);
              } catch (err) {
                setUploadError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
              } finally {
                setUploading(false);
                e.target.value = '';
              }
            }}
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-full sm:w-auto"
            >
              {uploading ? '업로드 중...' : '사진 선택'}
            </Button>
            {uploadSuccess ? (
              <span className="text-xs font-semibold text-emerald-600">업로드 완료</span>
            ) : authUser?.profileImage ? (
              <span className="text-xs font-semibold text-gray-500">미리보기</span>
            ) : null}
          </div>
          {uploadError && <p className="mt-2 text-xs font-semibold text-red-500">{uploadError}</p>}
        </div>

        <Button variant="outline" className="w-full" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
      <ConsultButton formUrl="https://forms.gle/FchKdDcm23JdGHpK9" />
    </div>
  );
}
