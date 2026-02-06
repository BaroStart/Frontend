export type UserRole = 'mentor' | 'mentee';

/** 멘토 담당 과목 (국어/영어/수학) */
export type MentorSubject = '국어' | '영어' | '수학';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  school?: string;
  profileImage?: string;
  /** 멘토인 경우 담당 과목 */
  subject?: MentorSubject;
}
