export type UserRole = 'mentor' | 'mentee';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  school?: string; // 멘티용
}
