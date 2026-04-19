// src/Home.jsx
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>ホーム画面</h1>
      <nav>
        <Link to="/login">ログイン</Link> | <Link to="/register">新規登録</Link>
      </nav>
    </div>
  );
}

export default Home;
