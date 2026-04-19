// src/components/LogoutButton.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

const LogoutButton = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // CSRF トークンを取得する関数
    const getCsrfToken = () => {
        const match = document.cookie.match(/csrftoken=([\w-]+)/);
        return match ? match[1] : null;
    };

  const handleLogout = async () => {
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(`${API_BASE}/api/auth/logout/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });
      if (response.ok) {
        logout(); // AuthContext の状態をクリアする
        navigate('/login'); // ログアウト後、ログインページに遷移するなど
      } else {
        console.error('ログアウトに失敗しました');
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <button onClick={handleLogout}>
      ログアウト
    </button>
  );
};

export default LogoutButton;
