import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const formStyle = {
  width: '700px'
};

const labelStyle = {
  display: 'block',
  marginBottom: '5px'
};

const inputStyle = {
  width: '300px',
  height: '30px',
  marginBottom: '15px'
};

const inputTitleStyle = {
  width: '500px',
  height: '30px',
  marginBottom: '15px'
};

const ProjectForm = ({ onSuccess, initialData = {} }) => {
  const [year, setYear] = useState(initialData.year || '');
  const [startDate, setStartDate] = useState(initialData.start_date || '');
  const [name, setName] = useState(initialData.name || '');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { year, start_date: startDate, name };
    try {
      if (!csrfToken) {
        throw new Error("CSRF token not available");
      }
      // 新規作成の場合はPOST、更新の場合はPUT
      const endpoint = initialData.id 
        ? `${API_BASE}/api/projects/${initialData.id}/`
        : `${API_BASE}/api/projects/`;
      const method = initialData.id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('プロジェクトの保存に失敗しました');
      }
      const responseData = await response.json();
      console.log('保存成功:', responseData);
      if (onSuccess) {
        onSuccess(responseData);
      }
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={formStyle}>
        <label style={labelStyle}>開始日:</label>
        <input
          style={inputStyle}
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>プロジェクト名:</label>
        <input
          style={inputTitleStyle}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button type="submit">
        {initialData.id ? '更新' : '保存'}
      </button>
    </form>
  );
};

export default ProjectForm;
