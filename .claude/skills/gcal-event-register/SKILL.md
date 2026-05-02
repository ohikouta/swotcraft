---
name: gcal-event-register
description: プロジェクトの作業枠とマイルストーンを Google Calendar に標準化された形で登録する。グローバル CLAUDE.md の命名体系（prj-* / oss-* / role-* / study-* / life-* / fin-*）に対応するカレンダーへ書き込み、終業時に予定→実績の差分を反映する。MCP google-calendar 経由。
---

# gcal-event-register

プロジェクト → Google Calendar への書き込みを共通化するスキル（プレイブック型）。
実体コードはない。Claude Code セッション内で MCP `google-calendar` を呼び出す際のお作法を定義する。

## 目的

- 各プロジェクトの「作業枠」「マイルストーン」が、対応カレンダーに統一フォーマットで載っている状態を保つ
- ユーザーが GCal を見たときに、何が走っていて何が完了したかが一目で把握できる
- 終業時に「予定 vs 実績」の差分が見える状態を作る

## カレンダー命名の対応

カレンダー名 = レーン名 = グローバル CLAUDE.md の命名体系（`~/.claude/CLAUDE.md` 参照）。

| グループ | 例 |
|---|---|
| `prj-*` | `prj-django-project`, `prj-vue-chat` |
| `oss-*` | `oss-cmux`, `oss-projen`, `oss-aws-cdk` |
| `role-*` / `study-*` | `role-shindan`, `study-data` |
| `life-*` / `fin-*` | `life-housing`, `fin-budget` |

**プロジェクト名 → カレンダー名は 1:1 対応**。新規プロジェクトを始める前に、対応カレンダーが GCal 上に存在することを `mcp__google-calendar__list-calendars` で確認する。

## 標準動作

### 1. 作業開始時：当日の作業枠を登録

```
mcp__google-calendar__create-event
  calendarId:  <prj-xxx>
  summary:     <タイトル一行サマリ>
  description: |
    link: <Issue/PR URL or no-git>
    done-when: <完了条件>
    tag: #<lane-name>
  start:  <YYYY-MM-DDTHH:MM:SS+09:00>
  end:    <YYYY-MM-DDTHH:MM:SS+09:00>
```

- start / end は JST。タイムゾーンを必ず付ける
- `description` 内の link / done-when は **task-board-sync のカードと同じフィールド** を使う。看板と GCal で同じ語彙を保つ

### 2. ミッション・マイルストーン：終日イベントで登録

```
mcp__google-calendar__create-event
  calendarId:  <prj-xxx>
  summary:     [MS] <マイルストーン名>
  description: |
    done-when: <完了条件>
    link: <該当 Issue or no-git>
  start:    <YYYY-MM-DD>          # 終日イベント
  end:      <YYYY-MM-DD>
```

- 終日イベントは date 形式（`YYYY-MM-DD`）。dateTime ではない
- summary 先頭の `[MS]` プレフィックスでマイルストーンと作業枠を視覚的に区別

### 3. 完了時：実績更新と Slack 報告

完了時のアクション 3 点セット：

1. GCal の予定を **実績として更新**（`mcp__google-calendar__update-event`）
   - `summary` 末尾に `[done]` を付加
   - `description` の末尾に `actual: Xh` を追記
2. task-board-sync で看板上のカードを `[x]` に更新
3. `notify-slack` skill で対応 Slack チャンネルに完了報告

```bash
source .claude/skills/notify-slack/notify.sh
notify_slack "<@U08RPS2BLUD> ✅ <タイトル> done. link: <URL>" "$SLACK_CHANNEL_ID"
```

## カレンダーが存在しない場合

新規プロジェクトを開始する際、対応カレンダーが未作成のことがある。その場合：

1. `mcp__google-calendar__list-calendars` で確認
2. 無ければ「カレンダー `<prj-xxx>` を新規作成しますか？」とユーザーに確認
3. 承認後に新規作成（GCal 側 UI で作成 or MCP 経由）

エージェントが勝手にカレンダーを作らないこと。

## トリガー（自走の設計）

| タイミング | 動作 |
|---|---|
| 作業開始（セッション内で「これから X する」と宣言された時） | 作業枠を当日に登録 |
| マイルストーン宣言時 | 終日イベントとして登録 |
| 作業完了時 | 予定を実績に更新 + 看板更新 + Slack 報告 |

## 前提

- Claude Code に MCP `google-calendar` が allow 済み
- カレンダー名の命名体系がグローバル CLAUDE.md に従っている

## 非機能

- MCP が利用不可な端末では **静かに skip**（このスキルはガイドラインなので、実呼び出しはセッション側の責務）
- 同じ作業枠を二重登録しない（`description` に link を入れることで重複検出可能）
