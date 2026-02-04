import type { DailyStudyPattern, SubjectStudyTime } from '@/types';

import axiosInstance from './axiosInstance';

/** 과목별 학습 시간 */
export async function fetchSubjectStudyTimes(
  menteeId: string
): Promise<SubjectStudyTime[]> {
  const { data } = await axiosInstance.get<SubjectStudyTime[]>(
    `/mentor/mentees/${menteeId}/learning/subject-times`
  );
  return data;
}

/** 주간 학습 패턴 */
export async function fetchWeeklyPatterns(
  menteeId: string
): Promise<DailyStudyPattern[]> {
  const { data } = await axiosInstance.get<DailyStudyPattern[]>(
    `/mentor/mentees/${menteeId}/learning/weekly-patterns`
  );
  return data;
}
