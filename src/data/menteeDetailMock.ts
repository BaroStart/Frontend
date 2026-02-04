import type {
  FeedbackItem,
  IncompleteAssignment,
  MenteeKpi,
  MenteeTask,
  TodayComment,
} from '@/types';

export const MOCK_MENTEE_TASKS: MenteeTask[] = [
  { id: 't1', menteeId: 's1', date: '2025-02-02', title: '영어 듣기 평가 20문제', subject: '영어', completed: true, completedAt: '오전 8:00' },
  { id: 't2', menteeId: 's1', date: '2025-02-02', title: '수학 개념 노트 정리 (미분)', subject: '수학', completed: false, estimatedMinutes: 30 },
  { id: 't3', menteeId: 's1', date: '2025-02-02', title: '국어 비문학 지문 3개 읽기', subject: '국어', completed: true, completedAt: '오후 1:30' },
  { id: 't4', menteeId: 's1', date: '2025-02-02', title: '화학 원소 주기', subject: '과학', completed: false },
  { id: 't5', menteeId: 's1', date: '2025-02-01', title: '영어 독해', subject: '영어', completed: true, completedAt: '오후 3:00' },
  { id: 't6', menteeId: 's1', date: '2025-02-01', title: '국어 문법', subject: '국어', completed: true, completedAt: '오후 5:00' },
  { id: 't7', menteeId: 's1', date: '2025-02-03', title: '수학 연습', subject: '수학', completed: false },
  { id: 't8', menteeId: 's1', date: '2025-02-03', title: '화학 실험', subject: '과학', completed: false },
  { id: 't9', menteeId: 's2', date: '2025-02-04', title: '물리 실험 정리', subject: '과학', completed: false },
  { id: 't10', menteeId: 's2', date: '2025-02-04', title: '수학 문제풀이', subject: '수학', completed: true, completedAt: '오전 9:00' },
];

export const MOCK_FEEDBACK_ITEMS: FeedbackItem[] = [
  { id: 'f1', assignmentId: 'a1', menteeId: 's1', title: '영어 독해 - Chapter 5 문제풀이', subject: '영어', submittedAt: '2025.02.02 오전 10:45', status: 'urgent' },
  { id: 'f2', assignmentId: 'a2', menteeId: 's1', title: '영어 단어 암기 - Day 15', subject: '영어', submittedAt: '2025.02.02 오후 3:20', status: 'pending' },
  { id: 'f3', assignmentId: 'a3', menteeId: 's1', title: '수학 미적분 - 연습문제 3-2', subject: '수학', submittedAt: '2025.02.02 오후 5:30', status: 'partial', progress: 60, lastUpdate: '오후 5:30' },
  { id: 'f4', assignmentId: 'a4', menteeId: 's1', title: '국어 비문학 독해 - 연습문제 2 완료', subject: '국어', submittedAt: '2025.02.01', status: 'completed', feedbackText: '지문의 핵심 내용을 잘 파악했어요. 다만 세부 정보를 묻는 문제에서 실수가 있었으니...', feedbackDate: '2025.02.01 오후 8:30' },
  { id: 'f5', assignmentId: 'a5', menteeId: 's1', title: '수학 기하 - 벡터 문제 풀이 완료', subject: '수학', submittedAt: '2025.02.01', status: 'completed', feedbackDate: '2025.02.01 오후 6:15' },
  { id: 'f6', assignmentId: 'a6', menteeId: 's1', title: '과학 실험 보고서 - 화학 반응', subject: '과학', submittedAt: '2025.02.05 오전 9:00', status: 'pending' },
  { id: 'f11', assignmentId: 'a11', menteeId: 's1', title: '수학 오답노트 정리', subject: '수학', submittedAt: '2025.02.04 오전 9:00', status: 'urgent' },
  { id: 'f12', assignmentId: 'a12', menteeId: 's1', title: '영어 듣기 평가', subject: '영어', submittedAt: '2025.02.04 오후 2:00', status: 'pending' },
  { id: 'f7', assignmentId: 'a7', menteeId: 's1', title: '국어 문학 - 시 감상문', subject: '국어', submittedAt: '2025.02.10 오후 2:00', status: 'pending' },
  { id: 'f8', assignmentId: 'a8', menteeId: 's2', title: '물리 실험 보고서 - 뉴턴 법칙', subject: '과학', submittedAt: '2025.02.04 오전 10:00', status: 'urgent' },
  { id: 'f9', assignmentId: 'a9', menteeId: 's2', title: '수학 미적분 - 적분 연습', subject: '수학', submittedAt: '2025.02.03 오후 3:00', status: 'pending' },
  { id: 'f10', assignmentId: 'a10', menteeId: 's2', title: '영어 독해 - 지문 분석', subject: '영어', submittedAt: '2025.02.01', status: 'completed', feedbackDate: '2025.02.02 오후 5:00' },
];

export const MOCK_INCOMPLETE_ASSIGNMENTS: IncompleteAssignment[] = [
  { id: 'i1', menteeId: 's1', title: '영어 독해 - Chapter 5 문제풀이', subject: '영어', description: '교재: 수능특강 영어독해/페이지: 45-52', status: 'completed', completedAt: '오전 10:45', completedAtDate: '2025-02-02' },
  { id: 'i2', menteeId: 's1', title: '수학 미적분 - 연습문제 3-2', subject: '수학', description: '교재: EBS 수능완성 수학 / 페이지: 78-82', deadline: '오후 11:59', deadlineDate: '2025-02-02', status: 'in_progress' },
  { id: 'i3', menteeId: 's1', title: '국어 문법 - 품사 분류 연습', subject: '국어', description: '워크시트 5장 / 온라인 제출', deadline: '오후 11:59', deadlineDate: '2025-02-03', status: 'not_started' },
  { id: 'i4', menteeId: 's1', title: '영어 단어 암기 - Day 15', subject: '영어', description: '단어장: 수능필수 영단어 / 50개', status: 'completed', completedAt: '오후 3:20', completedAtDate: '2025-02-02' },
  { id: 'i5', menteeId: 's1', title: '수학 오답노트 정리', subject: '수학', description: '지난주 모의고사 틀린 문제 5개', deadline: '1시간 후', deadlineDate: '2025-02-02', status: 'deadline_soon' },
  { id: 'i6', menteeId: 's1', title: '영어 에세이 - 환경 문제', subject: '영어', description: '200자 이상 영작', deadline: '오후 11:59', deadlineDate: '2025-02-06', status: 'not_started' },
  { id: 'i11', menteeId: 's1', title: '국어 문학 감상문', subject: '국어', description: '시 2편 분석', deadline: '오후 11:59', deadlineDate: '2025-02-04', status: 'deadline_soon' },
  { id: 'i12', menteeId: 's1', title: '과학 실험 예비보고서', subject: '과학', description: '실험 설계 및 가설', status: 'completed', completedAt: '오전 11:00', completedAtDate: '2025-02-04' },
  { id: 'i7', menteeId: 's1', title: '과학 탐구 보고서', subject: '과학', description: '주제 선정 및 계획서', deadline: '오후 11:59', deadlineDate: '2025-02-15', status: 'not_started' },
  { id: 'i8', menteeId: 's2', title: '물리 실험 보고서', subject: '과학', description: '뉴턴 제2법칙 검증 실험', deadline: '오후 11:59', deadlineDate: '2025-02-04', status: 'deadline_soon' },
  { id: 'i9', menteeId: 's2', title: '수학 미적분 문제집', subject: '수학', description: '3단원 연습문제 1-20', deadline: '오후 11:59', deadlineDate: '2025-02-05', status: 'in_progress' },
  { id: 'i10', menteeId: 's2', title: '영어 에세이', subject: '영어', description: '환경 보호 주제 200자', status: 'completed', completedAt: '오후 2:00', completedAtDate: '2025-02-03' },
];

export const MOCK_TODAY_COMMENTS: TodayComment[] = [
  { id: 'c1', menteeId: 's1', authorName: '박지민', content: '오늘은 영어 독해 문제를 많이 풀었는데요, 지문이 길어질수록 집중력이 떨어지는 것 같아요. 어떻게 하면 긴 지문도 끝까지 집중해서 읽을 수 있을까요?', createdAt: '오전 9:23' },
  { id: 'c2', menteeId: 's2', authorName: '이서연', content: '물리 실험 보고서를 작성했는데, 그래프 해석 부분이 어려웠어요. 데이터 해석 방법을 조금 더 알려주실 수 있을까요?', createdAt: '오전 10:15' },
];

export const MOCK_MENTEE_KPIS: MenteeKpi[] = [
  { menteeId: 's1', totalStudyHours: 247, studyHoursChange: 12, assignmentCompletionRate: 89, completionRateChange: 5, averageScore: 92.3, scoreChange: 0, attendanceRate: 96, attendanceChange: 2 },
  { menteeId: 's2', totalStudyHours: 198, studyHoursChange: 8, assignmentCompletionRate: 92, completionRateChange: 3, averageScore: 88.5, scoreChange: 2, attendanceRate: 94, attendanceChange: 1 },
];

export const SUBJECTS = ['전체', '국어', '영어', '수학', '과학', '사회', '자기주도'] as const;
