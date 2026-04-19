import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectList from '../components/ProjectList';
import ProjectForm from '../components/ProjectForm';
import ProjectModal from '../components/ProjectModal';

const wrapperStyle = {
  width: '100%',
}

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const getCsrfToken = () => {
    const match = document.cookie.match(/csrftoken=([\w-]+)/);
    return match ? match[1] : null;
  };


  useEffect(() => {
    // CSRFトークンセット用エンドポイントにアクセス
    fetch(`${API_BASE}/api/csrf/`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log('CSRF cookie set:', data);
      })
      .catch(error => {
        console.error('CSRF cookie取得エラー:', error);
      });
  }, []);

  const fetchProjects = async () => {
    const csrfToken = getCsrfToken();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/projects/`, {
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setProjects(data);
      console.log('Fetched projects:', data);
    } catch (err) {
      console.error('プロジェクト取得エラー:', err);
    }
    console.log(projects);
    setLoading(false);
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  // 新規作成完了時のコールバック
  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [...prev, newProject]);
    // モーダルを閉じる
    setShowModal(false);
  }

  return (
    <div style={wrapperStyle}>
      <Header />
      <h1>プロジェクト一覧</h1>
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ProjectList projects={projects} />
      )}
      <button onClick={() => setShowModal(true)}>新規作成</button>
      {showModal && (
        <ProjectModal onClose={() => setShowModal(false)}>
          <ProjectForm onSuccess={handleProjectCreated} />
        </ProjectModal>
      )}

      <h1>基礎知識</h1>
      <nav>
      <h2>1次試験7科目</h2>
        <h2>経済学・経済政策</h2>
        <ul>
          <li><Link to="/swot">SWOT 作成ページ</Link></li>
          <li><Link to="/4p">4P 作成ページ</Link></li>
        </ul>
        <h2>財務・会計</h2>
        <ul>
          <li><Link to="/swot">BS/PLのコツ</Link></li>
          <li><Link to="/4p"></Link></li>
        </ul>
        <h2>企業経営理論</h2>
        <ul>
          <li>
            <Link to="/4p">第1編 経営戦略</Link>
            <ul>
              <li><Link to="/4p">第1章 企業活動と経営戦略の全体概要</Link></li>
              <li><Link to="/4p">第2章 事業戦略（競争戦略）</Link></li>
              <li><Link to="/4p">第3章 企業戦略（成長戦略）</Link></li>
              <li><Link to="/4p">第4章 技術経営</Link></li>
              <li><Link to="/4p">第5章 企業の社会的責任（CSR）とコーポレートガバナンス</Link></li>
            </ul>
          </li>
          <li>
            <Link to="/4p">第2編 組織論</Link>
            <ul>
              <li><Link to="/4p">第1章 組織構造論</Link></li>
              <li><Link to="/4p">第2章 組織行動論</Link></li>
              <li><Link to="/4p">第3章 人的資源管理</Link></li>
            </ul>
          </li>
          <li>
            <Link to="/4p">第3編 マーケティング</Link>
            <ul>
              <li><Link to="/4p">第1章 マーケティングの基礎概念</Link></li>
              <li><Link to="/4p">第2章 マーケティングマネジメント戦略の展開</Link></li>
              <li><Link to="/4p">第3章 マーケティング・リサーチ</Link></li>
              <li><Link to="/4p">第4章 消費者購買行動と組織購買行動</Link></li>
              <li><Link to="/4p">第5章 製品戦略</Link></li>
              <li><Link to="/4p">第6章 価格戦略</Link></li>
              <li><Link to="/4p">第7章 チャネル・物流戦略</Link></li>
              <li><Link to="/4p">第8章 プロモーション戦略</Link></li>
              <li><Link to="/4p">第9章 関係性マーケティングとデジタルマーケティング</Link></li>
            </ul>
          </li>
          <li>
            <h3>ツール</h3>
            <ul>
              <li><Link to="/swot">SWOT 作成ページ</Link></li>
              <li><Link to="/4p">4P 作成ページ</Link></li>
              <li><Link to="/4p">PEST 作成ページ</Link></li>
              <li><Link to="/4p">STP 作成ページ</Link></li>
            </ul>
          </li>
        </ul>
        <h2>運営管理（オペレーション・マネジメント）</h2>
        <ul>
          <li><Link to="/swot">SWOT 作成ページ</Link></li>
          <li><Link to="/4p">4P 作成ページ</Link></li>
        </ul>
        <h2>経営法務</h2>
        <ul>
          <li><Link to="/swot">SWOT 作成ページ</Link></li>
          <li><Link to="/4p">4P 作成ページ</Link></li>
        </ul>
        <h2>経営情報システム</h2>
        <ul>
          <li><Link to="/swot">SWOT 作成ページ</Link></li>
          <li><Link to="/4p">4P 作成ページ</Link></li>
        </ul>
        <h2>中小企業経営・政策</h2>
        <ul>
          <li><Link to="/swot">SWOT 作成ページ</Link></li>
          <li><Link to="/4p">4P 作成ページ</Link></li>
        </ul>
      <h2>2次試験事例</h2>
        <ul>
          <h2>令和2年</h2>
          <li>事例Ⅰ</li>
          <li>事例Ⅱ</li>
          <li>事例Ⅲ</li>
          <li>事例Ⅳ</li>
        </ul>

      <h2>登録養成課程ー実習記録</h2>
        <ul>
          <h2>実習記録</h2>
        </ul>
      <h2>Tips</h2>

      </nav>
      <Footer />
    </div>
  );
}

export default Dashboard;
