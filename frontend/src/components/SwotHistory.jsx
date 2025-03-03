import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../config';

function SwotHistory() {
  const { project_id, swot_id } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 例として、変更履歴取得用エンドポイントにリクエスト
    fetch(`${API_BASE}/api/projects/${project_id}/swot/${swot_id}/history/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("履歴の取得に失敗しました");
        }
        return response.json();
      })
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, [project_id, swot_id]);

  if (loading) return <p>履歴を読み込み中...</p>;
  if (error) return <p>履歴の読み込みに失敗しました: {error.message}</p>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', marginTop: '20px' }}>
      <h3>変更履歴</h3>
      {history.length > 0 ? (
        <ul>
          {history.map(entry => (
            <li key={entry.id} style={{ marginBottom: '8px' }}>
              <div>
                <strong>{entry.username}</strong> - <em>{new Date(entry.timestamp).toLocaleString()}</em>
              </div>
              <div>{entry.change_summary}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>変更履歴はありません。</p>
      )}
    </div>
  );
}

export default SwotHistory;
