import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import SWOTForm from '../components/SwotForm';
import CrossSwotForm from '../components/CrossSwotForm';

const SwotPage = () => {
  // SWOT 分析一覧を管理する state
  const [swotList, setSwotList] = useState([]);
  // クロスSWOT 分析一覧を管理する state を追加
  const [crossSwotList, setCrossSwotList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // バックエンドから SWOT 分析一覧を取得する関数
  const fetchSwotList = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/swot-analysis/`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setSwotList(data);
    } catch (err) {
      console.error('SWOT データ取得エラー:', err);
      setError('SWOT データの取得に失敗しました。');
    }
    setLoading(false);
  };

  const fetchCrossSwotList = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/cross-swot/`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setCrossSwotList(data);
    } catch (err) {
      console.error('クロスSWOT データ取得エラー:', err);
    }
  };

  useEffect(() => {
    fetchSwotList();
    fetchCrossSwotList();
  }, []);

  // SWOTForm のコールバック：新規 SWOT 作成時に swotList に追加
  const handleSWOTCreated = (newSwot) => {
    setSwotList((prev) => [...prev, newSwot]);
  };

  // クロスSWOTForm のコールバック：新規クロスSWOT 作成時に crossSwotList に追加
  const handleCrossSwotCreated = (newCrossSwot) => {
    console.log('新しいクロスSWOTが作成されました:', newCrossSwot);
    setCrossSwotList((prev) => [...prev, newCrossSwot]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>SWOT分析</h1>
      <SWOTForm onSuccess={handleSWOTCreated} />
      <hr />
      <h1>クロスSWOT分析</h1>
      <p>
        作成したSWOT分析からクロスSWOTを検討しましょう。<br />
        目標を明確に持った上で分析を行うということが大事です。
      </p>
      {/* parentSwotOptions として swotList を渡す */}
      <CrossSwotForm
        onSuccess={handleCrossSwotCreated}
        parentSwotOptions={swotList}
      />
      <h2>過去のSWOT分析一覧</h2>
      {loading && <p>読み込み中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && swotList.length === 0 ? (
        <p>まだ分析がありません。</p>
      ) : (
        <ul>
          {swotList.map((swot) => (
            <li key={swot.id} style={{ marginBottom: '15px' }}>
              <h3>{swot.title}</h3>
              <p>作成日時: {new Date(swot.created_at).toLocaleString()}</p>
              {swot.items && swot.items.length > 0 ? (
                <ul>
                  {swot.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.category}:</strong> {item.content}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>アイテムがありません。</p>
              )}
            </li>
          ))}
        </ul>
      )}
      <h2>過去のクロスSWOT分析一覧</h2>
      {crossSwotList.length === 0 ? (
        <p>まだクロスSWOTはありません。</p>
      ) : (
        <ul>
          {crossSwotList.map((crossSwot) => (
            <li key={crossSwot.id}>
              <h3>{crossSwot.title}</h3>
              <p>元のSWOT: {crossSwot.parent_swot}</p>
              <p>作成日時: {new Date(crossSwot.created_at).toLocaleString()}</p>
              {crossSwot.items && crossSwot.items.length > 0 ? (
                <ul>
                  {crossSwot.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.quadrant}:</strong> {item.content}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>アイテムがありません。</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SwotPage;
