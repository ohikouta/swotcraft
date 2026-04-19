// src/Login.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const getCsrfToken = () => {
    const match = document.cookie.match(/csrftoken=([\w-]+)/);
    return match ? match[1] : null;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const csrfToken = getCsrfToken();

    const response = await fetch(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage('ログイン成功');
      // 例: トークンやユーザー情報が data に含まれていると仮定
      login(data);
      // ログイン成功後、ユーザー用のダッシュボードへ遷移
      navigate('/dashboard');
    } else {
      setMessage(data.error || 'ログインに失敗しました');
    }
  };

  return (
    <div>
      <h2>ログイン</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>ユーザ名: </label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} />
        </div>
        <div>
          <label>パスワード: </label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} />
        </div>
        <button type="submit">ログイン</button>
      </form>
      {message && <p>{message}</p>}
      <p>
        アカウントをお持ちでない場合は <Link to="/register">こちらから登録</Link>
      </p>
    </div>
  );
}

export default Login;
