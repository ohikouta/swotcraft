// src/components/CrossSwotForm.jsx
import React, { useState } from 'react';
import { API_BASE } from '../config';

const CrossSwotForm = ({ onSuccess, parentSwotOptions = [] }) => {
  // 親SWOT選択用（親SWOTのIDを保持）
  const [parentSwot, setParentSwot] = useState('');
  // クロスSWOTのタイトル
  const [title, setTitle] = useState('');
  // 4象限それぞれの入力を、複数項目追加可能な形で state に保持
  const [items, setItems] = useState({
    SO: [''], // 強み×機会
    WO: [''], // 弱み×機会
    ST: [''], // 強み×脅威
    WT: ['']  // 弱み×脅威
  });

  // 入力変更時の処理（quadrant: 'SO'/'WO'/etc., index: 項目の位置, value: 入力値）
  const handleChange = (quadrant, index, value) => {
    const updatedItems = { ...items };
    updatedItems[quadrant][index] = value;
    setItems(updatedItems);
  };

  // 「追加」ボタンを押すと、その象限に新しい入力欄を追加
  const handleAddItem = (quadrant) => {
    const updatedItems = { ...items };
    updatedItems[quadrant].push('');
    setItems(updatedItems);
  };

  // フォーム送信時の処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    // 各象限の入力値から、空でない項目を抽出
    const itemsData = [];
    Object.keys(items).forEach(quadrant => {
      items[quadrant].forEach(content => {
        if (content.trim() !== '') {
          itemsData.push({ quadrant, content });
        }
      });
    });

    const data = {
      parent_swot: parentSwot,  // 親となるSWOTのID
      title,
      items: itemsData,
    };

    try {
      // CSRFトークンをCookieから取得する関数
      const getCsrfToken = () => {
        const match = document.cookie.match(/csrftoken=([\w-]+)/);
        return match ? match[1] : null;
      };
      const csrfToken = getCsrfToken();

      const response = await fetch(`${API_BASE}/api/cross-swot/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('クロスSWOTの保存に失敗しました');
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
      <div>
        <label>元のSWOT分析を選択:</label>
        <select value={parentSwot} onChange={(e) => setParentSwot(e.target.value)}>
          <option value="">-- 選択してください --</option>
          {parentSwotOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>クロスSWOTのタイトル:</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトルを入力"
        />
      </div>
      {/* 4象限のマトリックスレイアウト */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr 1fr',
          gridTemplateRows: 'auto 1fr 1fr',
          gap: '10px',
          alignItems: 'center',
          justifyItems: 'center',
          border: '1px solid #ccc',
          padding: '10px',
        }}
      >
        {/* 左上の空セル */}
        <div></div>
        {/* 横ヘッダー */}
        <div style={{ fontWeight: 'bold' }}>強み</div>
        <div style={{ fontWeight: 'bold' }}>弱み</div>
        {/* 左側のヘッダー：1行目 */}
        <div style={{ fontWeight: 'bold' }}>機会</div>
        {/* セル: 強み×機会 (SO) */}
        <div>
          {items.SO.map((item, index) => (
            <div key={index}>
              <input
                value={item}
                onChange={(e) => handleChange('SO', index, e.target.value)}
                placeholder="入力"
                style={{ width: '100%' }}
              />
            </div>
          ))}
          <button type="button" onClick={() => handleAddItem('SO')}>
            追加
          </button>
        </div>
        {/* セル: 弱み×機会 (WO) */}
        <div>
          {items.WO.map((item, index) => (
            <div key={index}>
              <input
                value={item}
                onChange={(e) => handleChange('WO', index, e.target.value)}
                placeholder="入力"
                style={{ width: '100%' }}
              />
            </div>
          ))}
          <button type="button" onClick={() => handleAddItem('WO')}>
            追加
          </button>
        </div>
        {/* 左側のヘッダー：2行目 */}
        <div style={{ fontWeight: 'bold' }}>脅威</div>
        {/* セル: 強み×脅威 (ST) */}
        <div>
          {items.ST.map((item, index) => (
            <div key={index}>
              <input
                value={item}
                onChange={(e) => handleChange('ST', index, e.target.value)}
                placeholder="入力"
                style={{ width: '100%' }}
              />
            </div>
          ))}
          <button type="button" onClick={() => handleAddItem('ST')}>
            追加
          </button>
        </div>
        {/* セル: 弱み×脅威 (WT) */}
        <div>
          {items.WT.map((item, index) => (
            <div key={index}>
              <input
                value={item}
                onChange={(e) => handleChange('WT', index, e.target.value)}
                placeholder="入力"
                style={{ width: '100%' }}
              />
            </div>
          ))}
          <button type="button" onClick={() => handleAddItem('WT')}>
            追加
          </button>
        </div>
      </div>
      <button type="submit">保存</button>
    </form>
  );
};

export default CrossSwotForm;
