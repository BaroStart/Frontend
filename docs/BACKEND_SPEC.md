# 백엔드 API 명세

프론트엔드와 연동 시 백엔드에서 구현해야 할 API 및 데이터 구조입니다.

---

## 환경 설정

| 환경 변수 | 설명 | 예시 |
|-----------|------|------|
| `VITE_USE_MOCK` | `false`로 설정 시 실제 API 호출 | `false` |
| `VITE_API_URL` | API 베이스 URL (프로덕션/외부 API) | `https://api.example.com` |
| `VITE_API_PROXY_TARGET` | 개발 시 `/api` 프록시 대상 (Vite) | `http://localhost:3000` |

**인증**: `Authorization: Bearer {accessToken}` 헤더로 JWT 전달 (axiosInstance에서 자동 첨부)

---

## API 엔드포인트 목록

### 1. 멘티 (Mentees)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/mentor/mentees` | 담당 멘티 목록 |
| GET | `/mentor/mentees/:id` | 멘티 상세 |

**응답: MenteeSummary**

```ts
interface MenteeSummary {
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
  scores?: {
    naesin?: { korean?: number; english?: number; math?: number };
    mockExam?: { korean?: number; english?: number; math?: number };
  };
}
```

---

### 2. 과제 (Assignments)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/mentor/assignments/submitted` | 제출된 과제 전체 |
| GET | `/mentor/mentees/:id/assignments/submitted` | 멘티별 제출 과제 |
| POST | `/mentor/mentees/:id/assignments` | 과제 등록 |

**GET 제출 과제 응답: SubmittedAssignment[]**

```ts
interface SubmittedAssignment {
  id: string;
  menteeId: string;
  title: string;
  subject: string;
  submittedAt: string;      // "2025.02.02 09:30"
  feedbackDone: boolean;
  iconType?: 'document' | 'camera' | 'book';
}
```

**POST 과제 등록 요청: RegisterAssignmentPayload**

```ts
interface RegisterAssignmentPayload {
  menteeId: string;
  dateMode: 'single' | 'recurring';
  singleDate?: string;           // "2025-02-15" (단일 날짜 시)
  recurringDays?: number[];      // [0,1,2,3,4,5,6] 0=일요일, 6=토요일
  recurringStartDate?: string;   // "2025-02-01"
  recurringEndDate?: string;    // "2025-02-28"
  recurringEndTime?: string;    // "23:59"
  title: string;
  goal: string;
  subject: string;               // "국어" | "영어" | "수학"
}
```

**POST 과제 등록 응답: RegisterAssignmentResult**

```ts
interface RegisterAssignmentResult {
  success: boolean;
  taskIds: string[];
  message?: string;
}
```

---

### 3. 멘티 상세 (Mentee Detail)

| 메서드 | 경로 | 설명 | Query |
|--------|------|------|-------|
| GET | `/mentor/mentees/:id/feedback` | 피드백 목록 | `subject`, `startDate`, `endDate` |
| GET | `/mentor/mentees/:id/assignments/incomplete` | 미완료 과제 | `startDate`, `endDate` |
| GET | `/mentor/mentees/:id/tasks` | 학습 일정 | `date`, `startDate`, `endDate` |
| GET | `/mentor/mentees/:id/comments/today` | 오늘의 한마디 | - |
| GET | `/mentor/mentees/:id/kpi` | KPI 지표 | - |

**FeedbackItem[]**

```ts
interface FeedbackItem {
  id: string;
  assignmentId: string;
  menteeId: string;
  title: string;
  subject: string;
  submittedAt: string;
  status: 'urgent' | 'pending' | 'partial' | 'completed';
  progress?: number;
  lastUpdate?: string;
  feedbackText?: string;
  feedbackDate?: string;
}
```

**IncompleteAssignment[]**

```ts
interface IncompleteAssignment {
  id: string;
  menteeId: string;
  title: string;
  subject: string;
  description?: string;
  deadline?: string;       // "오후 11:59"
  deadlineDate?: string;  // "2025-02-15"
  status: 'completed' | 'in_progress' | 'not_started' | 'deadline_soon';
  completedAt?: string;
  completedAtDate?: string;
}
```

**MenteeTask[]**

```ts
interface MenteeTask {
  id: string;
  menteeId: string;
  date: string;           // "2025-02-15"
  title: string;
  subject: string;
  completed: boolean;
  completedAt?: string;
  estimatedMinutes?: number;
}
```

**TodayComment**

```ts
interface TodayComment {
  id: string;
  menteeId: string;
  authorName: string;
  content: string;
  createdAt: string;
}
```

**MenteeKpi**

```ts
interface MenteeKpi {
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
```

---

### 4. 과제 상세 (Assignment Detail)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/mentor/mentees/:menteeId/assignments/:assignmentId` | 과제 상세 조회 |

**응답: AssignmentDetail**

```ts
interface AssignmentDetail {
  assignmentId: string;
  title: string;
  subject: string;
  date: string;
  goal: string;
  content: string;
  contentChecklist?: string[];
  relatedResources?: { id: string; name: string }[];
  studyColumn?: { title: string; content: string; readMoreLink?: string };
  providedPdfs: { id: string; name: string; size?: string }[];
  studentPhotos: { id: string; url: string; caption?: string }[];
  studentMemo?: string;
}
```

---

### 5. 피드백 작성 (Feedback)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/mentor/mentees/:menteeId/assignments/:assignmentId/feedback` | 피드백 제출 |
| GET | `/mentor/mentees/:menteeId/assignments/:assignmentId/feedback` | 피드백 조회 |

**POST 피드백 요청: SubmitFeedbackPayload**

```ts
interface SubmitFeedbackPayload {
  feedbackText: string;
  status: 'partial' | 'completed';
  progress?: number;  // partial 시 0-100
}
```

**POST/GET 피드백 응답: FeedbackDetail**

```ts
interface FeedbackDetail {
  id: string;
  assignmentId: string;
  menteeId: string;
  feedbackText: string;
  status: 'partial' | 'completed';
  progress?: number;
  feedbackDate: string;
  lastUpdate?: string;
}
```

---

### 6. 학습 분석 (Learning Analysis)

| 메서드 | 경로 | 설명 | Query |
|--------|------|------|-------|
| GET | `/mentor/mentees/:id/learning/subject-times` | 과목별 학습 시간 | - |
| GET | `/mentor/mentees/:id/learning/weekly-patterns` | 주간 학습 패턴 | - |

**SubjectStudyTime[]**

```ts
interface SubjectStudyTime {
  subject: string;
  hours: number;
}
```

**DailyStudyPattern[]**

```ts
interface DailyStudyPattern {
  day: string;        // "월요일", "화요일", ...
  hours?: number;
  filledBlocks: number;
  totalBlocks?: number;
}
```

---

## 인증

- 로그인 후 `accessToken`을 `useAuthStore`에 저장
- `axiosInstance`가 모든 요청에 `Authorization: Bearer {token}` 자동 첨부
- 401 응답 시 로그아웃 처리 필요 (인터셉터에서 처리 가능)

---

## 날짜/시간 형식

| 필드 | 형식 | 예시 |
|------|------|------|
| date, singleDate, deadlineDate | `YYYY-MM-DD` | `2025-02-15` |
| submittedAt, createdAt | 자유 형식 (한국어) | `2025.02.02 오전 10:45` |
| recurringEndTime | `HH:mm` | `23:59` |
| deadline | 한국어 표기 | `오후 11:59` |

---

## 참고: Mock 데이터 위치

- `src/data/mockMentees.ts` - 멘티, 제출 과제
- `src/data/menteeDetailMock.ts` - 피드백, 미완료 과제, 학습 일정, KPI 등
- `src/data/assignmentRegisterMock.ts` - 보완점, 학습 자료, 칼럼 템플릿
