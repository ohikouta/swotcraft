import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL; // 環境変数などで設定している前提

// ユーザーごとの色を決める関数例（簡単なハッシュからカラーを算出）
const getUserColor = (username) => {
  const colors = ['#FF5733', '#33C3FF', '#9D33FF', '#33FF57', '#FFC300'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

function CollaborativeSwotEditor({ swotId, projectId, initialTitle, initialItems, onSave }) {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState(initialTitle || '');
  const [items, setItems] = useState(
    initialItems || {
      Strength: [''],
      Weakness: [''],
      Opportunity: [''],
      Threat: ['']
    }
  );
  const [socket, setSocket] = useState(null);
  // 編集状態を管理する state。キーは「category-index」、値は { username, color }。
  const [editingState, setEditingState] = useState({});
  // CSRF トークン用の state
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

  // WebSocketの初期化
  useEffect(() => {
    if (!user) return;
    const wsUrl = import.meta.env.VITE_WS_URL;
    const ws = new WebSocket(`${wsUrl}/ws/swot-collab/${swotId}/`);
    setSocket(ws);

    ws.onopen = () => {
      console.log("SwotCollab WebSocket connected");
      // オンライン通知
      ws.send(JSON.stringify({
        type: "online",
        username: user.username,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // 自分の送信した内容であれば無視する（エコー対策）
      if (data.username === user.username) return;

      switch (data.type) {
        case "update_title":
          // 受信タイトルが現在のタイトルと同じ場合は更新しない
          if (data.title !== title) {
            setTitle(data.title);
          }
          break;
        case "update_item":
          setItems(prevItems => {
            const updated = { ...prevItems };
            if (updated[data.category]) {
              // もし同じ内容でなければ更新
              if (updated[data.category][data.index] !== data.content) {
                updated[data.category][data.index] = data.content;
              }
            }
            return updated;
          });
          break;
        case "editing_field":
          // data は { type: "editing_field", category, index, username, status } 
          // status: "start" または "stop"
          const fieldKey = `${data.category}-${data.index}`;
          setEditingState(prev => {
            const newState = { ...prev };
            if (data.status === "start") {
              newState[fieldKey] = {
                username: data.username,
                color: data.color || getUserColor(data.username)
              };
            } else if (data.status === "stop") {
              delete newState[fieldKey];
            }
            return newState;
          });
          break;
        default:
          console.log("Unknown event type:", data.type);
      }
    };

    ws.onerror = (error) => {
      console.error("SwotCollab WebSocket error:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "offline",
          username: user.username,
        }));
      }
      ws.close();
    };
  }, [swotId, user, title]); // titleを依存に追加するかどうかは注意（無限ループに注意）

  // タイトル変更時にリアルタイム送信
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "update_title",
        title: newTitle,
        username: user.username,
      }));
    }
  };

  // 各アイテム変更時のハンドラー
  const handleItemChange = (category, index, value) => {
    const updatedItems = { ...items };
    if (typeof updatedItems[category][index] === 'object') {
      updatedItems[category][index] = { ...updatedItems[category][index], content: value };
    } else {
      updatedItems[category][index] = value;
    }
    setItems(updatedItems);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "update_item",
        category,
        index,
        content: value,
        username: user.username,
      }));
    }
  };

  // アイテム追加
  const handleAddItem = (category) => {
    const updatedItems = { ...items };
    updatedItems[category].push('');
    setItems(updatedItems);
  };

  // アイテム削除
  const handleDeleteItem = (category, index) => {
    const updatedItems = { ...items };
    updatedItems[category].splice(index, 1);
    setItems(updatedItems);
  };

  // 編集開始
  const startEditingField = (category, index) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const color = getUserColor(user.username);
      socket.send(JSON.stringify({
        type: "editing_field",
        category,
        index,
        username: user.username,
        status: "start",
        color: color,
      }));
    }
  };

  // 編集終了
  const stopEditingField = (category, index) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "editing_field",
        category,
        index,
        username: user.username,
        status: "stop",
      }));
    }
  };

  // 保存ボタンのハンドラー
  const handleSave = async () => {
    // items をリスト形式に変換
    const transformedItems = [];
    for (const category in items) {
      items[category].forEach(item => {
        if (typeof item === 'object') {
          if (item.content && item.content.trim() !== '') {
            if (item.id) {
              transformedItems.push({ id: item.id, category, content: item.content });
            } else {
              transformedItems.push({ category, content: item.content });
            }
          }
        } else if (typeof item === 'string') {
          if (item.trim() !== '') {
            transformedItems.push({ category, content: item });
          }
        }
      });
    }

    const payload = {
      title,
      items: transformedItems,
      project: projectId,
    };

    if (!csrfToken) {
      console.error('CSRF token is not available.');
      return;
    }

    try {
      const endpoint = swotId
        ? `${API_BASE}/api/projects/${projectId}/swot/${swotId}/`
        : `${API_BASE}/api/projects/${projectId}/swot/`;
      const method = swotId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("保存に失敗しました");
      const data = await response.json();
      if (onSave) onSave(data);
      console.log("保存成功:", data);
    } catch (err) {
      console.error("保存エラー:", err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>SWOT 分析の共同編集</h2>
      <div>
        <label>タイトル:</label>
        <input
          value={title}
          onChange={handleTitleChange}
          style={{ width: '100%', padding: '8px', marginBottom: '20px' }}
        />
      </div>
      {Object.keys(items).map((category) => (
        <div key={category} style={{ marginBottom: '20px' }}>
          <h3>{category}</h3>
          {items[category].map((item, index) => {
            const fieldKey = `${category}-${index}`;
            const editingInfo = editingState[fieldKey];
            const value = typeof item === 'object' ? item.content : item;
            return (
              <div key={fieldKey} style={{ marginBottom: '10px', position: 'relative', paddingRight: '24px' }}>
                {editingInfo && (
                  <div style={{
                    position: 'absolute',
                    top: '-16px',
                    left: '0',
                    fontSize: '0.7em',
                    background: editingInfo.color,
                    padding: '2px 4px',
                    borderRadius: '4px',
                    color: '#fff'
                  }}>
                    {editingInfo.username}編集中
                  </div>
                )}
                <input
                  value={value}
                  onChange={(e) => handleItemChange(category, index, e.target.value)}
                  placeholder={`Enter ${category} idea`}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: editingInfo ? `2px solid ${editingInfo.color}` : '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  onFocus={() => startEditingField(category, index)}
                  onBlur={() => stopEditingField(category, index)}
                />
                <button 
                  onClick={() => handleDeleteItem(category, index)}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'red',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
          <button type="button" onClick={() => handleAddItem(category)}>
            {category}項目を追加
          </button>
        </div>
      ))}
      <button onClick={handleSave}>保存</button>
    </div>
  );
}

export default CollaborativeSwotEditor;
