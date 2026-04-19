import { useState } from 'react';
import { API_BASE } from '../config';


function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        // エラー時はレスポンスをテキストとして取得してエラーとして扱う
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
  
      const data = await response.json();
      setMessage('登録成功！ログインしてください。');
    } catch (error) {
      console.error('Error:', error);
      setMessage('登録に失敗しました。');
    }
  };
  

  return (
    <div>
      <h2>新規登録</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>ユーザ名: </label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} />
        </div>
        <div>
          <label>メール: </label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} />
        </div>
        <div>
          <label>パスワード: </label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} />
        </div>
        <button type="submit">登録</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;
