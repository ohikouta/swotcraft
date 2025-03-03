// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';


export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // 初期状態として localStorage から読み込む（任意）
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // バックエンドから現在のユーザー情報を取得する関数
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/current-user/`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('現在のユーザー情報:', data);
        setUser(data);
        // 最新情報を localStorage に保存（任意）
        localStorage.setItem('currentUser', JSON.stringify(data));
      } else {
        setUser(null);
        localStorage.removeItem('currentUser');
      }
    } catch (error) {
      console.error('現在のユーザー情報取得エラー:', error);
      setUser(null);
      localStorage.removeItem('currentUser');
    } finally {
      setLoading(false);
    }
  };

  // アプリ起動時に現在のユーザー情報を取得
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // ログイン時に呼ばれる関数
  const login = (userData) => {
    setUser(userData);
    setLoading(false);
    // ログイン成功時は localStorage にも保存（必要なら）
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  // ログアウト時に呼ばれる関数
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
