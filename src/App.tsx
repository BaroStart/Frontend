import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layouts/ProtectedRoute';
import { MentorLayout } from './components/layouts/MentorLayout';
import { MenteeLayout } from './components/layouts/MenteeLayout';
import { LoginPage } from './pages/LoginPage';
import { MentorMainPage } from './pages/mentor/MentorMainPage';
import { MenteeDetailPage } from './pages/mentor/MenteeDetailPage';
import { AssignmentRegisterPage } from './pages/mentor/AssignmentRegisterPage';
import { FeedbackWritePage } from './pages/mentor/FeedbackWritePage';
import { MenteeMainPage } from './pages/mentee/MenteeMainPage';
import { AssignmentDetailPage } from './pages/mentee/AssignmentDetailPage';
import { FeedbackDetailPage } from './pages/mentee/FeedbackDetailPage';
import { MyPage } from './pages/mentee/MyPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 멘토 라우트 */}
        <Route element={<ProtectedRoute allowedRole="mentor" />}>
          <Route element={<MentorLayout />}>
            <Route path="/mentor" element={<MentorMainPage />} />
            <Route path="/mentor/mentees/:menteeId" element={<MenteeDetailPage />} />
            <Route
              path="/mentor/mentees/:menteeId/assignments/new"
              element={<AssignmentRegisterPage />}
            />
            <Route
              path="/mentor/mentees/:menteeId/feedback/:assignmentId"
              element={<FeedbackWritePage />}
            />
          </Route>
        </Route>

        {/* 멘티 라우트 */}
        <Route element={<ProtectedRoute allowedRole="mentee" />}>
          <Route element={<MenteeLayout />}>
            <Route path="/mentee" element={<MenteeMainPage />} />
            <Route path="/mentee/assignments/:assignmentId" element={<AssignmentDetailPage />} />
            <Route path="/mentee/feedback" element={<FeedbackDetailPage />} />
            <Route path="/mentee/mypage" element={<MyPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
