# CLAUDE.md

このファイルは Claude Code（claude.ai/code）がこのリポジトリで作業する際に読むプロジェクトレベルの指示書。
平時はこの 1 ファイル＋ `~/.claude/CLAUDE.md`（個人グローバル）の 2 階層で運用する。

> **このひな形は `platform-standards/catalog/claude-md/project-generic.md` の canonical 配布物。**
> このファイルはプロジェクト側で書き換えない（ReadOnly 運用）。プロジェクト固有のメモは隣に `CLAUDE.local.md` 等のローカル拡張ファイルを作って分離すること。

## このプロジェクトの位置づけ

<!-- TODO: プロジェクトの 1 段落サマリ。何のための repo で、誰が使うかを書く -->
- **目的**: <!-- e.g. 社内向け××API。月次集計を Slack に流す -->
- **オーナー**: <!-- e.g. @ohikouta -->
- **対応 Slack チャンネル**: <!-- e.g. #prj-xxx（~/.claude/CLAUDE.md の命名体系に従う） -->
- **対応 Google Calendar**: <!-- e.g. prj-xxx -->

## 共通規約（platform-standards 由来）

このプロジェクトは `platform-standards.lock.json` で導入物を管理している。導入状況は `psctl status` で確認できる。

### Slack 通知

`<@U08RPS2BLUD>` メンション付きで Slack に投稿するときは、共通スキル `notify-slack` を使う：

```bash
psctl fetch catalog/skills/notify-slack --dest .claude/skills/notify-slack    # 未導入なら 1 回だけ
source .claude/skills/notify-slack/notify.sh
notify_slack "<@U08RPS2BLUD> 作業開始" "$SLACK_CHANNEL_ID"
```

`SLACK_BOT_TOKEN` は `~/.config/patrol/secrets.sh` から自動で読まれる。`SLACK_CHANNEL_ID` は呼び出し時に明示的に渡すか環境変数で指定する。

### Git / GitHub 運用

`platform-standards/catalog/guidelines/git-workflow.md` の規約に従う（branch 命名・commit 規約・PR 運用）。
ローカルに canonical を置く場合は：

```bash
psctl fetch catalog/guidelines/git-workflow.md --dest docs/standards/git-workflow.md
```

要点だけ抜粋：

- `main` への直接 push は禁止。`pre-push-protect-main` Hook で reject される（後述）。
- branch 名は `<type>/<topic>` の kebab-case（`feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `security/`）。
- commit メッセージは Conventional Commits 風。`<type>(<scope>): <subject>`。

### main 保護

clone 後に 1 回だけ：

```bash
psctl fetch catalog/hooks/pre-push-protect-main --dest .githooks
chmod +x .githooks/pre-push
git config core.hooksPath .githooks
```

## 進捗管理（Slack / Calendar / Obsidian）

`~/.claude/CLAUDE.md` のグローバル指示に従う：

- **作業開始時**: 当日の作業枠を対応カレンダーに入れる（`gcal-event-register` skill 参照）。
- **ミッション・マイルストーン**: 達成予定日をカレンダーに登録する。
- **完了時**: 予定を実績として更新し、対応 Slack チャンネルに進捗を報告する（`notify-slack` skill）。
- セッション単位ではなく、計画に対する成果を報告する。
- **タスク看板**: Obsidian の `タスク.md` に自プロジェクトのレーンを 1 つ持ち、`task-board-sync` skill が GitHub Issue/PR と整合させる。
  - カードフォーマット: `task-board-sync/card-template.md` 参照
  - 起動: SessionStart / 重要イベント時にエージェントが主体的に呼び出す

## Project-specific notes

> 以降は各プロジェクトで自由に追記する領域。共通規約セクションは触らない。

<!-- TODO:
- セットアップ手順（依存・初期化スクリプト）
- 開発・テスト・デプロイの代表コマンド
- アーキテクチャ概略 / 触ってはいけないファイル
- 外部サービスとの結線（DB, 外部 API, etc.）
-->
