import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { API_BASE } from '../../config';


function ChatComponent({ roomId }) {
  const { user, loading } = useContext(AuthContext);
  const [messages, setMessages] = useState([]); // 各メッセージは { sender, message } のオブジェクト
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  console.log("ChatComponent: loading =", loading, "user =", user);

  // チャット履歴のロード
  useEffect(() => {
    console.log("Fetching chat history, current user:", user);
    async function fetchChatHistory() {
      try {
        const response = await fetch(`${API_BASE}/api/chat/${roomId}/messages/`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched messages:", data);
          setMessages(data);
        } else {
          console.error("Failed to fetch chat history");
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchChatHistory();
  }, [roomId, user]);

  // WebSocket 接続の処理
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    const newSocket = new WebSocket(`${wsUrl}/ws/chat/${roomId}/`);
    setSocket(newSocket);
    
    newSocket.onopen = () => {
      console.log('WebSocket connected');
    };

    newSocket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("Received message via WebSocket:", data);
        // data に sender と message が含まれる前提
        setMessages(prev => [...prev, { sender: data.sender, message: data.message }]);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    newSocket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      newSocket.close();
    };
  }, [roomId]);

  const sendMessage = () => {
    if (socket && input.trim()) {
      const payload = {
        sender: user ? user.username : "Anonymous",
        message: input.trim(),
      };
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
        setInput('');
      } else {
        console.warn('WebSocket is not open.');
      }
    }
  };

  return (
    <div>
      <h2>Chat Room: {roomId}</h2>
      {loadingHistory ? (
        <div>Loading chat history...</div>
      ) : (
        <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'auto', padding: '8px' }}>
          {messages.map((msg, index) => {
            console.log("Rendering message:", msg);
            return (
              <div
                key={index}  // 可能なら msg.id など一意なIDに変更する
                style={{
                  textAlign: user && msg.sender === user.username ? 'right' : 'left',
                  marginBottom: '10px'
                }}
              >
                {/* 送信者ラベルを常に表示。sender がない場合は "Unknown" を表示 */}
                <div style={{ fontSize: '0.8em', color: '#555', marginBottom: '4px' }}>
                  {msg.sender ? (user && msg.sender === user.username ? "You" : msg.sender) : "Unknown"}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    background: user && msg.sender === user.username ? 'green' : 'gray',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    maxWidth: '70%',
                  }}
                >
                  {msg.message}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <input
        type="text"
        placeholder="メッセージを入力..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        style={{ width: '80%', marginRight: '5px' }}
      />
      <button onClick={sendMessage}>送信</button>
    </div>
  );
}

export default ChatComponent;
