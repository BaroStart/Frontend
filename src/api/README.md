# API 레이어

백엔드 연동을 위한 API 서비스 모듈입니다.

## 설정

- `VITE_USE_MOCK=true` (기본값): mock 데이터 사용
- `VITE_USE_MOCK=false`: 실제 백엔드 API 호출
- `VITE_API_URL`: API 베이스 URL (예: `https://api.example.com`)

`.env` 파일에 설정하거나 빌드 시 환경 변수로 전달하세요.

## API 엔드포인트 (백엔드 구현 시 참고)

| 서비스 | 메서드 | 경로 | 설명 |
|--------|--------|------|------|
| mentees | GET | `/mentor/mentees` | 담당 멘티 목록 |
| mentees | GET | `/mentor/mentees/:id` | 멘티 상세 |
| assignments | GET | `/mentor/assignments/submitted` | 제출 과제 전체 |
| assignments | GET | `/mentor/mentees/:id/assignments/submitted` | 멘티별 제출 과제 |
| assignments | POST | `/mentor/mentees/:id/assignments` | 과제 등록 |
| menteeDetail | GET | `/mentor/mentees/:id/feedback` | 피드백 목록 |
| menteeDetail | GET | `/mentor/mentees/:id/assignments/incomplete` | 미완료 과제 |
| menteeDetail | GET | `/mentor/mentees/:id/tasks` | 학습 일정 |
| menteeDetail | GET | `/mentor/mentees/:id/comments/today` | 오늘의 한마디 |
| menteeDetail | GET | `/mentor/mentees/:id/kpi` | KPI 지표 |

## 인증

`useAuthStore`의 `accessToken`이 있으면 `Authorization: Bearer {token}` 헤더로 자동 첨부됩니다.
