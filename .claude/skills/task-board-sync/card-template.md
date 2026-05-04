# カードフォーマット（canonical）

タスク看板（kanban-plugin 形式）に登録するカードの正本テンプレート。
既存の和文タブインデント運用を尊重しつつ、エージェントが必要とする `link:` / `done-when:` を追加する形。

## 基本形

```
- [ ] <タイトル>
	
	@{YYYY-MM-DD}
	予定：<例: 2h> / 実績：h
	link: <GitHub Issue/PR URL or "no-git">
	done-when: <完了条件 1 行>
	#<lane-name>
```

> インデントは **タブ文字**（kanban-plugin 仕様）。スペースに変換しないこと。
> カード本文（`- [ ]` の行）の次は **空行を 1 行**置く（既存運用に倣う）。

## フィールド定義

| フィールド | 必須 | 内容 |
|---|---|---|
| タイトル | ◯ | 一行サマリ。動詞＋目的語推奨（例: "psctl bootstrap を実装する"）|
| `@{YYYY-MM-DD}` | ◯ | 看板の日付（kanban-plugin の date 形式）|
| `予定：Xh / 実績：h` | ◯ | 見積工数 / 実績工数の和文表記。実績は完了時に埋める |
| `link:` | ◯ | GitHub Issue/PR の URL。手動タスクの場合は `no-git` |
| `done-when:` | ◯ | 完了条件 1 行 |
| `#<lane>` | ◯ | プロジェクトレーン名のタグ（`#prj-xxx` など）|

## カード例

GitHub Issue 紐付き:

```
- [ ] psctl bootstrap を実装する
	
	@{2026-05-01}
	予定：2h / 実績：h
	link: https://github.com/ohikouta/platform-standards/issues/12
	done-when: PR merge ＋ Slack で完了報告
	#prj-platform-standards
```

GitHub 紐付け無し（手動タスク）:

```
- [ ] 議事録テンプレを作る
	
	@{2026-05-02}
	予定：30m / 実績：h
	link: no-git
	done-when: テンプレを wiki に登録、Slack で共有
	#prj-django-project #manual-task
```

`#manual-task` タグを併記することで、看板上で手動タスクが視覚的に区別できる。

## 完了条件（done-when）の書き方

「何をもって完了とするか」を 1 文で表す。曖昧さを排する。

良い例:
- `done-when: PR が main に merge され、Slack に完了報告投稿`
- `done-when: Calendar に作業枠が反映され、当日終業まで実施`

悪い例:
- `done-when: 終わったら` ← 何が「終わり」か不明
- `done-when: 様子を見る` ← 完了条件になっていない

## アーカイブ

Done レーンで完了から 7 日経過したカードは、月次でアーカイブファイル（`タスク-archive-YYYY-MM.md`）へ退避する。看板本体は軽く保つ。
