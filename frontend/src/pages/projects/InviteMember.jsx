// InviteMember.jsx
import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config';


function InviteMember({ projectId, token }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [csrfToken, setCsrfToken] = useState(null);
  
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
  }, [token]);

  const handleInvite = () => {
    fetch(`${API_BASE}/api/projects/${projectId}/invite-member/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ user_id: selectedUser })
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        // 招待が成功した場合の処理
      })
      .catch(error => console.error('Error inviting user:', error));
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
      <button onClick={handleInvite}>招待する</button>
    </div>
  );
}

export default InviteMember;
