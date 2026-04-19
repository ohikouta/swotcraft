// src/routes/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  // 読み込み中は何も表示しない、またはローディングスピナーを表示する
  if (loading) {
    return <div>Loading...</div>;
  }

  // 認証されていなければ /login にリダイレクト
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 認証済みなら子コンポーネントを表示
  return children;
};

export default ProtectedRoute;
