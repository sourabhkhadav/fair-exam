import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Lazy-loaded route components (code-splitting)
const Landing_Home = lazy(() => import('./components/Landing_Home'))
const AuthForm = lazy(() => import('./components/AuthForm'))
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'))
const Examiner_Layout = lazy(() => import('./components/Examiner_Layout'))
const Examiner_Dashboard = lazy(() => import('./components/Examiner_Dashboard'))
const Examiner_CreateExam = lazy(() => import('./components/Examiner_CreateExam'))
const Examiner_AddQuestions = lazy(() => import('./components/Examiner_AddQuestions'))
const Examiner_ManageExams = lazy(() => import('./components/Examiner_ManageExams'))
const Examiner_ViolationReports = lazy(() => import('./components/Examiner_ViolationReports'))
const Examiner_ResultsPublishing = lazy(() => import('./components/Examiner_ResultsPublishing'))
const Examiner_DraftConfigure = lazy(() => import('./components/Examiner_DraftConfigure'))
const Examiner_EditExam = lazy(() => import('./components/Examiner_EditExam'))
const Examiner_StudentViolations = lazy(() => import('./components/Examiner_StudentViolations'))
const Profile = lazy(() => import('./components/Profile'))
const Examiner_ExamResultDetails = lazy(() => import('./components/Examiner_ExamResultDetails'))
const Examiner_ManageCandidates = lazy(() => import('./components/Examiner_ManageCandidates'))

// Candidate Pages
const CandidateLogin = lazy(() => import('./pages/Login'))
const Instructions = lazy(() => import('./pages/Instructions'))
const Exam = lazy(() => import('./pages/Exam'))

// Lightweight loading fallback
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
    <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#0F172A', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0F172A',
            color: '#fff',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing_Home />} />
          <Route path="/login" element={<AuthForm initialMode="login" />} />
          <Route path="/register" element={<AuthForm initialMode="register" />} />

          {/* Candidate Routes */}
          <Route path="/candidate-login" element={<CandidateLogin />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/exam" element={<Exam />} />

          {/* Examiner Routes */}
          <Route element={<ProtectedRoute><Examiner_Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Examiner_Dashboard />} />
            <Route path="/create-exam" element={<Examiner_CreateExam />} />
            <Route path="/add-questions" element={<Examiner_AddQuestions />} />
            <Route path="/manage-exams" element={<Examiner_ManageExams />} />
            <Route path="/violation-reports" element={<Examiner_ViolationReports />} />
            <Route path="/results-publishing" element={<Examiner_ResultsPublishing />} />
            <Route path="/configure-exam/:id" element={<Examiner_DraftConfigure />} />
            <Route path="/edit-exam/:id" element={<Examiner_EditExam />} />
            <Route path="/student-violations/:id" element={<Examiner_StudentViolations />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/exam-results/:id" element={<Examiner_ExamResultDetails />} />
            <Route path="/manage-candidates/:id" element={<Examiner_ManageCandidates />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
              <h1 className="text-6xl font-bold text-[#0F172A]">404</h1>
              <p className="text-xl text-[#0F172A]/70 mt-4">Page Not Found</p>
              <Link to="/" className="mt-8 px-6 py-3 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-all">
                Go Home
              </Link>
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App;

