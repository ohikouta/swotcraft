---
name: task-board-sync
description: Obsidian Vault のタスク看板（タスク.md, kanban-plugin 形式）にプロジェクトレーンを維持し、GitHub Issue/PR の状態と整合させる。SessionStart や重要イベント時に主体的に呼び出され、ユーザーが看板を見たときに常に最新の状況が把握できる状態を保つ。
---

# task-board-sync

プロジェクトの状況を Obsidian タスク看板に常に反映させ続けるスキル。

## 目的

ユーザーが Obsidian の `タスク.md` を見たときに、各プロジェクトの状況が一目で把握できる状態を維持する。エージェント側が主体的に看板を更新し、看板の鮮度を保つ責務を持つ。

## トリガー

このスキルは **エージェントが主体的に** 起動する：

| タイミング | 動作 |
|---|---|
| SessionStart | 自プロジェクトのレーン状態を確認し、ズレていたら同期 |
| GitHub の Issue/PR 状態が変化した直後（merge / close 等） | 該当カードを更新 |
| ユーザーが `/task-board-sync` を明示的に叩いた | 全同期 |
| 週次（金曜終業時など）| 完了カードを Done レーンへアーカイブ |

## レーン規約

**レーンヘッダ表記**: `## ## <lane-name>`（既存 Vault の流儀に従う）

例:

```
## ## prj-django-project
## ## oss-cmux
```

レーン名 = グローバル CLAUDE.md の命名体系に準拠：

- `prj-django-project`, `prj-vue-chat`（個人プロジェクト）
- `oss-cmux`, `oss-projen`（OSS 活動）
- `role-shindan`（資格・ロール）
- `study-data`（学習）
- `life-housing`, `fin-budget`（生活・財務）

各プロジェクトは **1 レーン** を持つ。レーンが無ければ `task-board-sync` が新設する。

**挿入位置**: 既存の `## ## ...` プロジェクトレーン群の **末尾**（つまり次に来る `## # Daily` などの状態レーンの直前）。新規プロジェクトレーンが既存のプロジェクト群と固まって表示されるよう揃える。

## カードフォーマット（canonical）

詳細は `card-template.md`。既存の和文タブインデント運用に `link:` `done-when:` を追加した形：

```
- [ ] <タイトル>
	
	@{YYYY-MM-DD}
	予定：2h / 実績：h
	link: <GitHub Issue/PR URL or "no-git">
	done-when: <完了条件 1 行>
	#<lane-name>
```

- インデントはタブ
- `link: no-git` のカードは GitHub に紐付かない手動タスク。タグに `#manual-task` を併記する
- `done-when:` の条件が満たされたら、エージェントは看板上で `[ ]` → `[x]` に更新する

## 同期ルール

1. **GitHub に存在し、看板に無い**: 新規カードとして追加
2. **GitHub で close / merge 済み**: 看板側を完了状態に
3. **GitHub に無く、看板に手動タスクとして存在**: そのまま残す（`#manual-task` ラベルで明示）
4. **完了から 7 日経過したカード**: Done レーンへアーカイブ（週次）

## 端末差の吸収

Vault のパスは端末ごとに異なる。環境変数で指定：

| 変数 | 例 |
|---|---|
| `OBSIDIAN_VAULT_PATH` | 私用: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian-private`<br>業務: `~/Desktop/work` |
| `OBSIDIAN_BOARD_FILE` | デフォルト `タスク.md` |

設定ファイル: `~/.config/obsidian-task-sync/env.sh`（端末ごとに 1 回作成）。例:

```bash
# ~/.config/obsidian-task-sync/env.sh
export OBSIDIAN_VAULT_PATH="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian-private"
export OBSIDIAN_BOARD_FILE="タスク.md"
```

## 使い方

```bash
source .claude/skills/task-board-sync/sync.sh
task_board_sync_lane prj-django-project    # 自プロジェクトのレーンを同期
task_board_sync_archive_done               # 完了 7 日経過カードをアーカイブ
```

## 前提

- 看板は kanban-plugin 形式（`kanban-plugin: board` frontmatter 必須）
- インデントはタブ文字（kanban-plugin 仕様）
- `gh` CLI が認証済み（`gh auth status` が ok）

## 非機能

- `OBSIDIAN_VAULT_PATH` 未設定 / Vault 不在の端末では **静かに終了**（return 0）
- 看板書き換えはアトミック（一時ファイル → mv）
- 看板の frontmatter は破壊しない
