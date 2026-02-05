/** 학생이 기록한 일일 학습 플래너 (과목별 학습 시간) */
export interface PlannerRecord {
  id: string;
  menteeId: string;
  date: string; // YYYY-MM-DD
  subject: string;
  durationMinutes: number;
  /** 타임라인용 시작 시각 (0-23) */
  startHour?: number;
}

/** 플래너 피드백 (멘토가 작성) */
export interface PlannerFeedback {
  id: string;
  menteeId: string;
  date: string;
  feedbackText: string;
  createdAt: string;
}

const DEMO_DATE = '2026-02-04';

export const MOCK_PLANNER_RECORDS: PlannerRecord[] = [
  { id: 'pr1', menteeId: 's1', date: DEMO_DATE, subject: '수학', durationMinutes: 172, startHour: 6 },
  { id: 'pr2', menteeId: 's1', date: DEMO_DATE, subject: '영어', durationMinutes: 160, startHour: 9 },
  { id: 'pr3', menteeId: 's1', date: DEMO_DATE, subject: '사탐', durationMinutes: 74, startHour: 12 },
  { id: 'pr4', menteeId: 's1', date: DEMO_DATE, subject: '한국사', durationMinutes: 85, startHour: 13 },
  { id: 'pr5', menteeId: 's1', date: DEMO_DATE, subject: '문학', durationMinutes: 26, startHour: 15 },
  { id: 'pr6', menteeId: 's1', date: DEMO_DATE, subject: '과탐', durationMinutes: 37, startHour: 17 },
  { id: 'pr7', menteeId: 's2', date: DEMO_DATE, subject: '수학', durationMinutes: 120, startHour: 8 },
  { id: 'pr8', menteeId: 's2', date: DEMO_DATE, subject: '영어', durationMinutes: 90, startHour: 11 },
  { id: 'pr9', menteeId: 's2', date: DEMO_DATE, subject: '과학', durationMinutes: 60, startHour: 14 },
  { id: 'pr10', menteeId: 's1', date: '2026-02-03', subject: '수학', durationMinutes: 90, startHour: 9 },
  { id: 'pr11', menteeId: 's1', date: '2026-02-03', subject: '영어', durationMinutes: 75, startHour: 11 },
];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getPlannerRecordsByMenteeAndDate(
  menteeId: string,
  date: string
): PlannerRecord[] {
  return MOCK_PLANNER_RECORDS.filter((r) => r.menteeId === menteeId && r.date === date);
}

export function formatPlannerDuration(minutes: number): string {
  return formatDuration(minutes);
}
