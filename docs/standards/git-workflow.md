# Git / GitHub ワークフロー（共通規約）

このドキュメントは `platform-standards/catalog/guidelines/git-workflow.md` の canonical 配布物。
各プロジェクトはこの規約に従う前提で、CLAUDE.md ひな形（`catalog/claude-md/project-generic.md`）から参照される。

## 基本方針

- **GitHub の Issue が正式なタスク単位**、Pull Request が正式な実装・レビュー単位、リポジトリ履歴が永続的な実行記録。
- **GitHub 操作は可能な限り `gh` CLI を使う**。`gh` で完結しない場合 / ビジュアルレビューが必要な場合のみ Web UI を併用する。
- **`main` への直接 push は禁止**。feature branch → PR → merge の順を厳守する。

## ブランチ規約

ブランチ名は `<type>/<topic>` の kebab-case。

| type | 用途 |
|---|---|
| `feat/` | 機能追加 |
| `fix/` | バグ修正 |
| `docs/` | ドキュメントのみの変更 |
| `chore/` | ビルド・依存・雑務（標準化適用も含む）|
| `refactor/` | 振る舞い不変のコード整理 |
| `security/` | 脆弱性対応 |

例: `feat/notify-slack-mention`, `chore/adopt-platform-standards`

## コミットメッセージ

Conventional Commits 風: `<type>(<scope>): <subject>`

- `<type>` はブランチと同じ語彙
- `<scope>` は影響範囲（モジュール名・ディレクトリ名など）。省略可
- `<subject>` は **何をしたか** ではなく **なぜしたか** を意識する 1〜2 文

例:

- `feat(notify-slack): メンション必須化で誤投稿を防止`
- `chore(catalog): bootstrap 後の sha 不一致を修正`

## Pull Request 運用

1. `main` から branch を切る
2. branch 上で変更し、コミットを重ねる
3. push して `gh pr create` で PR を作る
4. レビュー → merge 後に `main` が更新される
5. ローカル `main` は `git pull --ff-only` で同期する

PR スコープはレビュー可能な範囲（おおむね 400 行未満を目安）に収める。大きな変更は段階的 PR に分割する。

## main 保護

GitHub の branch protection が使えない private repo では、ローカル Hook で代替する。

```bash
psctl fetch catalog/hooks/pre-push-protect-main      # 未導入なら 1 回だけ
git config core.hooksPath .githooks
```

`pre-push-protect-main` は `main` への直接 push を git 側で reject する。`--no-verify` で迂回しないこと（迂回すると保護が無効化される）。

## 認証

```bash
gh auth status      # トークン状態を確認
gh auth login -h github.com   # 切れていたら再ログイン
```

リモート操作の前に `gh auth status` を一度確認するのを習慣にする。

## Obsidian / 進捗管理との関係

- **GitHub に書くもの**: 正式な実装単位（Issue / PR）、永続コラボレーション記録
- **Obsidian / カレンダー / Slack に書くもの**: 補助コンテキスト、下書き、意思決定ログ、進捗報告

両者でタスク状態が食い違っているときは、操作前に最新の意図を確認すること。

## 出典

このガイドラインは `agent-playbook/docs/github-workflow.md` および `repository-guardrails.md` を統合・改訂したもの。canonical はこのファイル。
