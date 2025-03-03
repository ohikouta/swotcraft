// src/components/Header.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config';

// 共通の CSRF トークン取得関数
const getCsrfToken = () => {
  const match = document.cookie.match(/csrftoken=([\w-]+)/);
  return match ? match[1] : null;
};

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(`${API_BASE}/api/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken, // CSRF ヘッダーを追加
        },
      });
      if (response.ok) {
        logout();
      } else {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <header style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      <h1>中小企業診断士ツールサイト</h1>
      {user ? (
        <div>
          <span>ログイン中: {user.username}</span>
          <button onClick={handleLogout}>ログアウト</button>
        </div>
      ) : (
        <div>
          <Link to="/login">ログイン</Link>
        </div>
      )}
    </header>
  );
};

export default Header;
