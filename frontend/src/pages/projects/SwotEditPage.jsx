import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../../config';
import CollaborativeSwotEditor from '../../components/CollaborativeSwotEditor';

function SwotEditPage() {
    const { project_id, swot_id } = useParams(); // ルートで :id として設定している場合
    const [swotData, setSwotData] = useState(null);

    useEffect(() => {
        if (swot_id) {
            fetch(`${API_BASE}/api/projects/${project_id}/swot/${swot_id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(data => setSwotData(data))
            .catch(error => console.error('Error fetching SWOT:', error));
        }
    }, [project_id, swot_id]);

    if (swot_id && !swotData) {
        return <p>Loading SWOT...</p>;
    }

    return (
        <div>
            <h1>SWOTページ</h1>
            <CollaborativeSwotEditor 
                swotId={swot_id}
                projectId={project_id}
                initialTitle={swotData ? swotData.title : "SWOT Title"}
                initialItems={swotData ? transformSwotItems(swotData.items) : null}
            />
        </div>
    );
}

// 必要に応じて、バックエンドの形式に合わせた transform 関数を定義
const transformSwotItems = (items) => {
  const categories = { Strength: [], Weakness: [], Opportunity: [], Threat: [] };
  items.forEach(item => {
    if (categories[item.category] !== undefined) {
      categories[item.category].push(item.content);
    }
  });
  return categories;
};

export default SwotEditPage;
