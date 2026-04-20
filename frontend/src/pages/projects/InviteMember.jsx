// InviteMember.jsx
import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config';


function InviteMember({ projectId, onInvited }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [csrfToken, setCsrfToken] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // CSRFトークンをバックエンドの /api/csrf/ エンドポイントから取得
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/csrf/`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        } else {
          console.error('CSRF token not provided in response JSON.');
        }
      } catch (error) {
        console.error('CSRF token fetch error:', error);
      }
    };
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    if (!csrfToken) return;
    // 例: 登録ユーザー一覧を取得するエンドポイントがある場合
    fetch(`${API_BASE}/api/users/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      }
    })
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
  }, [csrfToken]);

  const handleInvite = async () => {
    if (!selectedUser) {
      setFeedback({ type: 'error', text: 'ユーザーを選択してください' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/invite-member/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ user_id: selectedUser })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setFeedback({ type: 'success', text: data.detail || 'ユーザーを招待しました' });
        setSelectedUser('');
        onInvited?.();
      } else {
        setFeedback({ type: 'error', text: data.detail || `招待に失敗しました (HTTP ${response.status})` });
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setFeedback({ type: 'error', text: 'ネットワークエラーで招待できませんでした' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3>メンバー追加</h3>
      <select onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser}>
        <option value="">--ユーザーを選択--</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.username}
          </option>
        ))}
      </select>
      <button onClick={handleInvite} disabled={submitting}>
        {submitting ? '招待中...' : '招待する'}
      </button>
      {feedback && (
        <p
          role="status"
          style={{
            color: feedback.type === 'success' ? 'green' : 'crimson',
            marginTop: '8px',
          }}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}

export default InviteMember;
