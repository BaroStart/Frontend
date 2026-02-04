import { useQuery } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import {
  MOCK_SUBJECT_STUDY_TIMES,
  MOCK_WEEKLY_PATTERNS,
} from '@/data/learningAnalysisMock';
import type { DailyStudyPattern, SubjectStudyTime } from '@/types';

export function useSubjectStudyTimes(menteeId: string | undefined) {
  return useQuery({
    queryKey: ['subjectStudyTimes', menteeId],
    queryFn: async (): Promise<SubjectStudyTime[]> => {
      if (!menteeId) return [];
      if (API_CONFIG.useMock) {
        return MOCK_SUBJECT_STUDY_TIMES[menteeId] ?? MOCK_SUBJECT_STUDY_TIMES.s1 ?? [];
      }
      // TODO: API 호출
      return [];
    },
    enabled: !!menteeId,
  });
}

export function useWeeklyPatterns(menteeId: string | undefined) {
  return useQuery({
    queryKey: ['weeklyPatterns', menteeId],
    queryFn: async (): Promise<DailyStudyPattern[]> => {
      if (!menteeId) return [];
      if (API_CONFIG.useMock) {
        return MOCK_WEEKLY_PATTERNS[menteeId] ?? MOCK_WEEKLY_PATTERNS.s1 ?? [];
      }
      // TODO: API 호출
      return [];
    },
    enabled: !!menteeId,
  });
}
