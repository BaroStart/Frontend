/** 국영수 과목별 성적 */
export interface SubjectScores {
  korean?: number;
  english?: number;
  math?: number;
}

/** 내신 / 모의고사 성적 */
export interface MenteeScores {
  naesin?: SubjectScores;
  mockExam?: SubjectScores;
}

/** 멘티 요약 (목록/카드용) */
export interface MenteeSummary {
  id: string;
  name: string;
  school: string;
  grade: string;
  gradeFull?: string;
  track: '이과' | '문과';
  progress: number;
  todaySubmitted: number;
  todayTotal: number;
  uncheckedCount: number;
  pendingFeedbackCount: number;
  learningCert?: string;
  learningCertUploaded?: string;
  weeklyAchievement?: number;
  weeklyChange?: number;
  lastActive?: string;
  mentoringStart?: string;
  desiredMajor?: string;
  scores?: MenteeScores;
}
