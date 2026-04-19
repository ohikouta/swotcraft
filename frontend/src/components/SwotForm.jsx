import React, { useState } from 'react';
import { API_BASE } from '../config';


const SwotForm = ({ onSuccess }) => {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState({
    Strength: [''],
    Weakness: [''],
    Opportunity: [''],
    Threat: ['']
  });

  const handleChange = (category, index, value) => {
    const updatedItems = { ...items };
    updatedItems[category][index] = value;
    setItems(updatedItems);
  };

  const handleAddItem = (category) => {
    const updatedItems = { ...items };
    updatedItems[category].push('');
    setItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ネストされた items の配列を作成
    const itemsData = [];
    Object.keys(items).forEach(category => {
      items[category].forEach(content => {
        if (content.trim() !== '') {
          itemsData.push({ category, content });
        }
      });
    });

    const data = {
      title,
      items: itemsData
    };

    try {
      const getCsrfToken = () => {
        const match = document.cookie.match(/csrftoken=([\w-]+)/);
        return match ? match[1] : null;
      };
      
      const csrfToken = getCsrfToken();
      // fetch を使って POST リクエストを送信
      const response = await fetch(`${API_BASE}/api/swot-analysis/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('SWOTの保存に失敗しました');
      }
      const responseData = await response.json();
      console.log('保存成功:', responseData);
      // 作成成功時、親コンポーネントへ通知（任意）
      if (onSuccess) {
        onSuccess(responseData);
      }
      // 必要に応じてフォームのリセット処理を追加可能
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>タイトル:</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      {Object.keys(items).map(category => (
        <div key={category}>
          <h3>{category}</h3>
          {items[category].map((item, index) => (
            <div key={index}>
              <input
                value={item}
                onChange={(e) => handleChange(category, index, e.target.value)}
                placeholder={`Enter ${category} idea`}
              />
            </div>
          ))}
          <button type="button" onClick={() => handleAddItem(category)}>
            {category}項目を追加
          </button>
        </div>
      ))}
      <button type="submit">保存</button>
    </form>
  );
};

export default SwotForm;
