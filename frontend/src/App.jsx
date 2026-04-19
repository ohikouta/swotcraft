// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';  // 追加
import Dashboard from './pages/Dashboard';
import SwotPage from './pages/SwotPage';
import FourPPage from './pages/FourPPage';
import ProjectDetail from './pages/ProjectDetail';
import ProtectedRoute from './routes/ProtectedRoute';
import SwotEditPage from './pages/projects/SwotEditPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />  {/* 新規登録用のルート */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/swot" element={
            <ProtectedRoute>
              <SwotPage />
            </ProtectedRoute>
          } />
          <Route path="/4p" element={
            <ProtectedRoute>
              <FourPPage />
            </ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          } />
          <Route path="/projects/:project_id/swot-edit/:swot_id?" element={
            <ProtectedRoute>
              <SwotEditPage />
            </ProtectedRoute>
          } />
          {/* DRF のルーターで生成されたエンドポイントは /api/ 以下に含む */}
          <Route path="/api/*" element={<div>API endpoint</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
