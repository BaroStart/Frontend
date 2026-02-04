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

**참고**: 통계 분석 리포트 생성 시 다음 API들의 데이터를 조합하여 사용합니다:
- `/mentor/mentees/:id/learning/subject-times` - 과목별 학습 시간
- `/mentor/mentees/:id/learning/weekly-patterns` - 주간 학습 패턴
- `/mentor/mentees/:id/feedback` - 피드백 목록 (과목별 세부 분석용)
- `/mentor/mentees/:id/kpi` - KPI 지표

---

### 7. 플래너 (Planner)

학생이 기록한 일일 학습 플래너를 멘토가 확인하고 피드백을 작성합니다. 피드백은 멘티에게 전달됩니다.

| 메서드 | 경로 | 설명 | Query |
|--------|------|------|-------|
| GET | `/mentor/mentees/:id/planner/records` | 멘티의 플래너 기록 조회 | `date` (YYYY-MM-DD) |
| GET | `/mentor/mentees/:id/planner/feedback` | 플래너 피드백 조회 | `date` (YYYY-MM-DD) |
| POST | `/mentor/mentees/:id/planner/feedback` | 플래너 피드백 저장/수정 | - |
| GET | `/mentee/planner/feedback` | 멘티: 내 플래너 피드백 조회 | `date` (YYYY-MM-DD) |

**PlannerRecord[] (학생이 기록한 학습 데이터)**

```ts
interface PlannerRecord {
  id: string;
  menteeId: string;
  date: string;           // "2025-02-04"
  subject: string;        // "수학", "영어", "국어" 등
  durationMinutes: number;
  startHour?: number;     // 타임라인용 (0-23)
}
```

**POST 플래너 피드백 요청: PlannerFeedbackPayload**

```ts
interface PlannerFeedbackPayload {
  date: string;           // "2025-02-04"
  feedbackText: string;
}
```

**플래너 피드백 응답: PlannerFeedback**

```ts
interface PlannerFeedback {
  id: string;
  menteeId: string;
  date: string;
  feedbackText: string;
  createdAt: string;      // ISO 8601
  mentorId?: string;      // 작성자(멘토) ID
}
```

**플로우:**
1. 멘티가 일일 학습 기록(과목별 시간)을 앱에 저장 → `PlannerRecord` 생성
2. 멘토가 `/mentor/mentees/:id/planner/records?date=...` 로 기록 조회
3. 멘토가 피드백 작성 후 `POST /mentor/mentees/:id/planner/feedback` 호출
4. 멘티가 `/mentee/planner/feedback?date=...` 로 피드백 조회

---

### 8. 통계 분석 리포트

통계 분석 리포트는 프론트엔드에서 위의 API들을 조합하여 생성합니다. 별도의 API 엔드포인트는 필요하지 않습니다. 별도의 API 엔드포인트는 필요하지 않습니다.

**리포트 생성에 필요한 데이터:**
- 과목별 학습 시간 (`/mentor/mentees/:id/learning/subject-times`)
- 주간 학습 패턴 (`/mentor/mentees/:id/learning/weekly-patterns`)
- 피드백 목록 (`/mentor/mentees/:id/feedback`) - 과목별 세부 분석을 위해 사용
- KPI 지표 (`/mentor/mentees/:id/kpi`)

**리포트 내용:**
- 전반적인 학습 태도 및 공부 스타일 종합
- 생활패턴 분석 (주간 학습 패턴, 과목별 학습 시간)
- 과목별 상세 분석 (국어/영어/수학)
  - 학습 스타일
  - 취약한 부분
  - 실수 유형
  - 지도 방향
- 종합 평가 및 상담 마무리 멘트

**PDF 다운로드**: 프론트엔드에서 브라우저 인쇄 기능을 활용하여 처리합니다.

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
- `src/data/plannerMock.ts` - 플래너 기록 (PlannerRecord)
