# SwotCraft

戦略分析フレームワーク（SWOT / 4P / クロス SWOT）をリアルタイム共同編集できるプロジェクト管理サービス。Django (DRF + Channels) + React (Vite) 構成。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Backend | Django 4.2 / DRF 3.14 / Channels 4.0 / Daphne |
| Frontend | React 18 / Vite 6 / react-router 7（JSX、意図的に TypeScript 未使用） |
| DB | PostgreSQL（本番）/ SQLite（ローカル） |
| Realtime | Django Channels + Redis |
| Runtime | Python 3.10.12 |
| Deploy | Backend: Heroku / Frontend: Vercel |

## 主要機能

- ユーザー認証（セッションベース）
- プロジェクト管理・メンバー招待
- SWOT 分析（共同編集、WebSocket でリアルタイム同期）
- 4P 分析
- クロス SWOT
- プロジェクト単位のチャットルーム

## セットアップ（ローカル開発）

### 前提
- Docker / Docker Compose
- または Python 3.10 + Node.js 20+ + Redis

### docker-compose で一括起動（推奨）

```bash
cp .env.example .env   # 値を埋める
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Redis: localhost:6379

### 個別起動

```bash
# Backend
pip install -r requirements.txt
cd src && python manage.py migrate && daphne config.asgi:application --port 8000

# Frontend
cd frontend && npm install && npm run dev

# Redis（別ターミナル）
redis-server
```

## テスト

```bash
# Backend（pytest）
pip install -r requirements-dev.txt
pytest

# Frontend（後続 PR で vitest 導入予定）
cd frontend && npm run lint
cd frontend && npm run format:check
```

## 環境変数

`.env.example` を参照。主要な変数：

| 変数 | 用途 |
|---|---|
| `SECRET_KEY` | Django シークレット |
| `DEBUG` | True/False |
| `ALLOWED_HOSTS` | カンマ区切り |
| `DATABASE_URL` | 未指定時は sqlite:///db.sqlite3 |
| `REDIS_URL` | Channels レイヤー用。Heroku Key-Value Store |

## 本番デプロイ

### Backend (Heroku)

- `Procfile`: `daphne config.asgi:application`
- Heroku Postgres + Heroku Key-Value Store アドオン前提
- buildpack: Python

### Frontend (Vercel)

- ビルドコマンド: `npm run build`
- 出力: `dist/`

## ディレクトリ構成

```
.
├── src/                 Django プロジェクト
│   ├── app/             単一アプリ（モデル・ビュー・consumer）
│   └── config/          設定・URL・ASGI
├── frontend/            React アプリ
│   └── src/
│       ├── pages/       ルート単位の画面
│       └── components/  共通部品
├── containers/          Dockerfile 群
├── docker-compose.yml
├── Procfile             Heroku 起動定義
├── requirements.txt     Python 依存
└── runtime.txt          Heroku Python バージョン
```

## 今後の方向性

個人学習・ポートフォリオとして段階的に品質を引き上げる 4 フェーズで改善中。

- Phase A: 土台整備（README / env.example / テスト基盤 / Lint）
- Phase B: SWOT モデル重複の整理
- Phase C: WebSocket 状態の Redis 永続化
- Phase D: CI/CD・セキュリティ・Sentry
