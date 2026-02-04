/** 오늘의 한마디 & 질문 */
export interface TodayComment {
  id: string;
  menteeId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

/** 멘티 KPI 지표 */
export interface MenteeKpi {
  menteeId: string;
  totalStudyHours: number;
  studyHoursChange: number;
  assignmentCompletionRate: number;
  completionRateChange: number;
  averageScore: number;
  scoreChange: number;
  attendanceRate: number;
  attendanceChange: number;
}
