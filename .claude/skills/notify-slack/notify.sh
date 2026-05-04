#!/usr/bin/env bash
# notify-slack canonical 版
#   - chat.postMessage を叩く
#   - ~/.config/patrol/secrets.sh の SLACK_BOT_TOKEN / SLACK_CHANNEL_ID を利用
#   - BOT_TOKEN 未設定なら静かに return（CI や secrets 未配備で落ちない）
#
# Usage:
#   source notify.sh
#   notify_slack "<@U08RPS2BLUD> 作業開始" "$SLACK_CHANNEL_ID"

notify_slack() {
  local text="$1"
  local channel="${2:-}"
  local secrets_file="$HOME/.config/patrol/secrets.sh"
  [[ -f "$secrets_file" ]] && source "$secrets_file"
  [[ -z "${SLACK_BOT_TOKEN:-}" ]] && return 0
  local target="${channel:-${SLACK_CHANNEL_ID:-}}"
  [[ -z "$target" ]] && return 0
  local payload
  payload="$(python3 -c "import json,sys; print(json.dumps({'channel': sys.argv[1], 'text': sys.argv[2]}))" "$target" "$text")"
  curl -s -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
    -H 'Content-type: application/json' \
    --data "$payload" \
    >/dev/null 2>&1 || true
}
