#!/usr/bin/env bash
# task-board-sync — Obsidian タスク看板（kanban-plugin）と GitHub 状態を同期する。
#
# 使い方（直接実行）:
#   task-board-sync                       # cwd の .claude/project.json から lane を取る
#   task-board-sync prj-django-project    # 明示
#   task-board-sync --archive [days]      # Done レーンの古いカードをアーカイブ
#
# Source して関数を使う形:
#   source .claude/skills/task-board-sync/sync.sh
#   task_board_sync_lane prj-django-project
#   task_board_sync_archive_done
#
# 環境変数（明示で指定したいときだけ）:
#   OBSIDIAN_VAULT_PATH   Vault のルート（未指定なら自動検出）
#   OBSIDIAN_BOARD_FILE   看板ファイル名（既定: タスク.md）

set -uo pipefail

# 設定ファイルがあれば読む（明示優先）
_TBSYNC_ENV="${TBSYNC_ENV:-$HOME/.config/obsidian-task-sync/env.sh}"
[[ -f "$_TBSYNC_ENV" ]] && source "$_TBSYNC_ENV"

OBSIDIAN_BOARD_FILE="${OBSIDIAN_BOARD_FILE:-タスク.md}"

# _tbsync_autodetect_vault
#   OBSIDIAN_VAULT_PATH が未設定なら、定石の場所を探して 1 つだけ見つかれば採用。
#   複数見つかれば警告し失敗（明示指定を促す）。
_tbsync_autodetect_vault() {
  if [[ -n "${OBSIDIAN_VAULT_PATH:-}" ]]; then
    return 0
  fi
  local candidates=()
  local glob_root="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents"
  if [[ -d "$glob_root" ]]; then
    while IFS= read -r d; do
      [[ -f "$d/$OBSIDIAN_BOARD_FILE" ]] && candidates+=("$d")
    done < <(find "$glob_root" -mindepth 1 -maxdepth 1 -type d 2>/dev/null)
  fi
  if [[ -d "$HOME/Desktop/work" && -f "$HOME/Desktop/work/$OBSIDIAN_BOARD_FILE" ]]; then
    candidates+=("$HOME/Desktop/work")
  fi
  if [[ ${#candidates[@]} -eq 1 ]]; then
    OBSIDIAN_VAULT_PATH="${candidates[0]}"
    export OBSIDIAN_VAULT_PATH
    return 0
  elif [[ ${#candidates[@]} -gt 1 ]]; then
    {
      echo "task-board-sync: multiple Vault candidates found — set OBSIDIAN_VAULT_PATH explicitly:"
      for c in "${candidates[@]}"; do echo "    $c"; done
    } >&2
    return 1
  fi
  return 1
}

task_board_path() {
  _tbsync_autodetect_vault || return 1
  local board="$OBSIDIAN_VAULT_PATH/$OBSIDIAN_BOARD_FILE"
  [[ -f "$board" ]] || return 1
  printf '%s' "$board"
}

task_board_available() {
  task_board_path >/dev/null 2>&1
}

# _tbsync_lane_from_project_json
#   現在のディレクトリ（または上方向）に .claude/project.json があれば lane を取り出す。
_tbsync_lane_from_project_json() {
  local d="$PWD"
  while [[ "$d" != "/" ]]; do
    local f="$d/.claude/project.json"
    if [[ -f "$f" ]]; then
      python3 - "$f" <<'PY' 2>/dev/null
import json, sys, pathlib
data = json.loads(pathlib.Path(sys.argv[1]).read_text() or "{}")
lane = data.get("lane", "")
if lane: print(lane)
PY
      return 0
    fi
    d="$(dirname "$d")"
  done
}

# task_board_sync_lane <lane>
#   指定レーンを GitHub の Issue/PR と同期する。レーンが無ければ作る。手動カード（link: no-git）は残す。
task_board_sync_lane() {
  local lane="${1:-}"
  if [[ -z "$lane" ]]; then
    echo "task-board-sync: lane name required" >&2
    return 2
  fi
  if ! task_board_available; then
    echo "task-board-sync: Vault not found (set OBSIDIAN_VAULT_PATH or place vault under iCloud Obsidian / ~/Desktop/work) — skip" >&2
    return 0
  fi
  local board; board="$(task_board_path)"

  local gh_json
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    gh_json="$(_tbsync_collect_github 2>/dev/null || printf '%s' '{"items":[]}')"
  else
    gh_json='{"items":[]}'
  fi

  python3 - "$board" "$lane" "$gh_json" <<'PY'
import sys, re, json, pathlib, datetime

board_path = pathlib.Path(sys.argv[1])
lane       = sys.argv[2]
gh         = json.loads(sys.argv[3])
gh_items   = gh.get("items", [])

text = board_path.read_text()

fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
if not fm_match or "kanban-plugin" not in fm_match.group(1):
    print(f"task-board-sync: {board_path.name} に kanban-plugin frontmatter 無し — skip",
          file=sys.stderr)
    sys.exit(0)

lane_re = re.compile(r'^(##\s.*)$', re.MULTILINE)

def parse_sections(t):
    splits  = list(lane_re.finditer(t))
    out     = []
    for i, m in enumerate(splits):
        head = m.group(1)
        body_start = m.end() + 1
        body_end   = splits[i+1].start() if i+1 < len(splits) else len(t)
        out.append([head, t[body_start:body_end], m.start(), body_end])
    return out

# Project lanes are written as "## ## <name>" to match the existing board's
# convention (## ## SAP / ## ## SAA / ## ## real-chat 等). The "## " prefix
# is required by kanban-plugin to recognize a lane; the second "## " is the
# lane title style as used in this vault.
target_header = f"## ## {lane}"

sections = parse_sections(text)

if not any(s[0] == target_header for s in sections):
    # Find insertion point: directly after the last "## ## ..." section.
    # Fallback: before the first "## # ..." (state lane like Daily/Done) or at end.
    proj_idxs = [i for i,s in enumerate(sections) if s[0].startswith("## ## ")]
    if proj_idxs:
        insert_at = sections[proj_idxs[-1]][3]
    else:
        state_idxs = [i for i,s in enumerate(sections) if s[0].startswith("## # ")]
        insert_at = sections[state_idxs[0]][2] if state_idxs else len(text)

    # Normalize spacing around the insertion point so we don't create stacks of
    # blank lines from prior runs.
    before = text[:insert_at].rstrip("\n")
    after  = text[insert_at:].lstrip("\n")
    new_block = f"\n\n{target_header}\n\n\n"
    text = before + new_block + after
    board_path.write_text(text)
    print(f"task-board-sync: created lane '{lane}' as '{target_header}'", file=sys.stderr)
    sections = parse_sections(text)

target_idx = next(i for i,s in enumerate(sections) if s[0] == target_header)
lane_body  = sections[target_idx][1]

card_re = re.compile(
    r'(- \[(?P<state>[ x])\] (?P<title>[^\n]+)\n'
    r'(?:[\t ]+[^\n]*\n)*?'
    r'[\t ]+link:\s*(?P<link>\S+)[^\n]*\n'
    r'(?:[\t ]+[^\n]*\n)*)',
    re.MULTILINE)

existing = {}
for m in card_re.finditer(lane_body):
    existing[m.group("link")] = {
        "state": m.group("state"),
        "title": m.group("title"),
        "raw":   m.group(1),
    }

today = datetime.date.today().isoformat()

def render_card(title, url, due, estimate, done_when, tags, state=" "):
    title = title.strip()
    return (
        f"- [{state}] {title}\n"
        f"\t\n"
        f"\t@{{{due}}}\n"
        f"\t予定：{estimate} / 実績：h\n"
        f"\tlink: {url}\n"
        f"\tdone-when: {done_when}\n"
        f"\t{tags}\n"
    )

appended = []
updated  = 0
for it in gh_items:
    url    = it["url"]
    title  = it["title"]
    closed = it["state"] in ("closed",) or it.get("merged") is True
    if url in existing:
        e = existing[url]
        if closed and e["state"] == " ":
            new_block = re.sub(r'^- \[ \]', '- [x]', e["raw"], count=1, flags=re.MULTILINE)
            lane_body = lane_body.replace(e["raw"], new_block, 1)
            updated += 1
        elif not closed and e["state"] == "x":
            new_block = re.sub(r'^- \[x\]', '- [ ]', e["raw"], count=1, flags=re.MULTILINE)
            lane_body = lane_body.replace(e["raw"], new_block, 1)
            updated += 1
    else:
        if closed:
            continue
        card = render_card(
            title=title, url=url, due=today, estimate="-",
            done_when="<未記入：完了条件を書くこと>",
            tags=f"#{lane}", state=" ",
        )
        appended.append(card)

if appended:
    if not lane_body.endswith("\n"):
        lane_body += "\n"
    lane_body += "\n" + "\n".join(appended)

sections[target_idx][1] = lane_body
new_text = text[:sections[0][2]]
for s in sections:
    new_text += s[0] + "\n" + s[1]

tmp = board_path.with_suffix(board_path.suffix + ".tmp")
tmp.write_text(new_text)
tmp.replace(board_path)

print(f"task-board-sync: lane='{lane}' added={len(appended)} updated={updated} "
      f"(github_items={len(gh_items)})", file=sys.stderr)
PY
}

_tbsync_collect_github() {
  local remote_url repo
  remote_url="$(git config --get remote.origin.url 2>/dev/null || true)"
  [[ -z "$remote_url" ]] && { echo '{"items":[]}'; return 0; }
  if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
    repo="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
  else
    echo '{"items":[]}'; return 0
  fi
  python3 - "$repo" <<'PY'
import json, subprocess, sys
repo = sys.argv[1]
def jq(args):
    out = subprocess.run(["gh"] + args + ["--repo", repo], capture_output=True, text=True)
    if out.returncode != 0: return []
    return json.loads(out.stdout or "[]")
issues = jq(["issue", "list", "--state", "all", "--limit", "100",
             "--json", "number,title,state,url"])
prs    = jq(["pr",    "list", "--state", "all", "--limit", "100",
             "--json", "number,title,state,url,mergedAt"])
items = []
for i in issues:
    items.append({"url": i["url"], "title": i["title"], "state": i["state"].lower()})
for p in prs:
    items.append({"url": p["url"], "title": p["title"],
                  "state": p["state"].lower(), "merged": bool(p.get("mergedAt"))})
print(json.dumps({"items": items}, ensure_ascii=False))
PY
}

task_board_sync_archive_done() {
  local days="${1:-7}"
  if ! task_board_available; then return 0; fi
  local board; board="$(task_board_path)"
  python3 - "$board" "$days" <<'PY'
import sys, re, pathlib, datetime
board = pathlib.Path(sys.argv[1])
days  = int(sys.argv[2])
text  = board.read_text()
lane_re = re.compile(r'^(##\s.*)$', re.MULTILINE)
splits  = list(lane_re.finditer(text))
sections = []
for i, m in enumerate(splits):
    head = m.group(1)
    body_start = m.end() + 1
    body_end   = splits[i+1].start() if i+1 < len(splits) else len(text)
    sections.append([head, text[body_start:body_end], m.start(), body_end])
done_idxs = [i for i,s in enumerate(sections) if s[0].strip().lower() in ("## done", "## 完了")]
if not done_idxs:
    print("task-board-sync: Done レーンが無い — skip", file=sys.stderr); sys.exit(0)
done_idx  = done_idxs[0]
done_body = sections[done_idx][1]
threshold = datetime.date.today() - datetime.timedelta(days=days)
card_re = re.compile(r'(- \[x\] [^\n]+\n(?:[\t ]+[^\n]*\n)*)', re.MULTILINE)
date_re = re.compile(r'@\{(\d{4}-\d{2}-\d{2})\}')
archived_cards = []
remaining      = done_body
for m in card_re.finditer(done_body):
    block = m.group(1)
    d = date_re.search(block)
    if not d: continue
    try: card_date = datetime.date.fromisoformat(d.group(1))
    except ValueError: continue
    if card_date <= threshold:
        archived_cards.append(block)
        remaining = remaining.replace(block, "", 1)
if not archived_cards:
    print("task-board-sync: archive 対象なし", file=sys.stderr); sys.exit(0)
ym = datetime.date.today().strftime("%Y-%m")
arch_path = board.parent / f"タスク-archive-{ym}.md"
existing = arch_path.read_text() if arch_path.exists() else f"# タスクアーカイブ {ym}\n\n"
arch_path.write_text(existing + "\n".join(archived_cards) + "\n")
sections[done_idx][1] = remaining
new_text = text[:sections[0][2]]
for s in sections:
    new_text += s[0] + "\n" + s[1]
tmp = board.with_suffix(board.suffix + ".tmp")
tmp.write_text(new_text)
tmp.replace(board)
print(f"task-board-sync: archived {len(archived_cards)} cards → {arch_path.name}",
      file=sys.stderr)
PY
}

# 直接実行された場合のエントリポイント
if [[ "${BASH_SOURCE[0]}" == "${0:-}" ]]; then
  case "${1:-}" in
    --archive)
      shift
      task_board_sync_archive_done "${1:-7}"
      ;;
    -h|--help)
      cat <<'EOF'
task-board-sync — Obsidian タスク看板を GitHub 状態と同期

USAGE
  task-board-sync [<lane>]            sync the given lane (or .claude/project.json's lane)
  task-board-sync --archive [days]    archive Done cards older than `days` (default 7)
  task-board-sync --help              show this help

ENV
  OBSIDIAN_VAULT_PATH   override vault auto-detect
  OBSIDIAN_BOARD_FILE   override board filename (default: タスク.md)
EOF
      ;;
    *)
      lane="${1:-}"
      if [[ -z "$lane" ]]; then
        lane="$(_tbsync_lane_from_project_json)" || true
      fi
      if [[ -z "$lane" ]]; then
        echo "task-board-sync: lane not specified and .claude/project.json not found" >&2
        echo "  hint: place {\"lane\": \"prj-xxx\"} in .claude/project.json, or pass it as argument." >&2
        exit 2
      fi
      task_board_sync_lane "$lane"
      ;;
  esac
fi
