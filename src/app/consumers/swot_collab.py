# app/consumers/swot_collab.py
import json

from channels.generic.websocket import AsyncWebsocketConsumer

from ..collab_state import (
    add_editing_user,
    get_editing_users,
    remove_all_fields_by_user,
    remove_editing_user,
    remove_field_editor,
    set_field_editor,
)


class SwotCollabConsumer(AsyncWebsocketConsumer):
    """SWOT 分析の共同編集 WebSocket Consumer。

    編集ロック状態は Redis に集約して保持する（app.collab_state 参照）。
    以前はクラス変数だったため、異なる swot_id の間で状態が混ざる潜在バグと
    プロセス再起動でロックが消える問題があった。
    """

    async def connect(self):
        self.swot_id = self.scope['url_route']['kwargs']['swot_id']
        self.group_name = f"swot_collab_{self.swot_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        if self.scope.get("user") and self.scope["user"].is_authenticated:
            self.username = self.scope["user"].username
        else:
            self.username = "Anonymous"

        # オンライン通知
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "user_status",
                "username": self.username,
                "status": "online",
            }
        )

    async def disconnect(self, close_code):
        # このユーザーが持っていた編集ロックを Redis から除去
        await remove_editing_user(self.swot_id, self.username)
        removed_fields = await remove_all_fields_by_user(self.swot_id, self.username)

        # 編集中ユーザー一覧を再ブロードキャストして他クライアントの表示を更新
        await self._send_editing_users()

        # 解除した各フィールドロックをグループに通知（残存表示を消すため）
        for field_key in removed_fields:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "editing_field_event",
                    "field_key": field_key,
                    "username": self.username,
                    "status": "stop",
                    "color": None,
                }
            )

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "user_status",
                "username": self.username,
                "status": "offline",
            }
        )
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get("type")

        if event_type == "update_title":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "update_title",
                    "title": data.get("title"),
                    "username": data.get("username"),
                }
            )
        elif event_type == "update_item":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "update_item",
                    "category": data.get("category"),
                    "index": data.get("index"),
                    "content": data.get("content"),
                    "username": data.get("username"),
                }
            )
        elif event_type == "editing_start":
            # ユーザー名はクライアント送信値ではなく self.username を使う
            # (偽装と disconnect クリーンアップとの不整合を防ぐ)
            await add_editing_user(self.swot_id, self.username)
            await self._send_editing_users()
        elif event_type == "editing_stop":
            await remove_editing_user(self.swot_id, self.username)
            await self._send_editing_users()
        elif event_type == "editing_field":
            await self._handle_editing_field(data)
        elif event_type in ("online", "offline"):
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "user_status",
                    "username": data.get("username"),
                    "status": event_type,
                }
            )

    async def update_title(self, event):
        await self.send(text_data=json.dumps({
            "type": "update_title",
            "title": event.get("title"),
            "username": event.get("username"),
        }))

    async def update_item(self, event):
        await self.send(text_data=json.dumps({
            "type": "update_item",
            "category": event.get("category"),
            "index": event.get("index"),
            "content": event.get("content"),
            "username": event.get("username"),
        }))

    async def user_status(self, event):
        await self.send(text_data=json.dumps({
            "type": "status",
            "username": event.get("username"),
            "status": event.get("status"),
        }))

    async def _send_editing_users(self):
        """編集中のユーザー一覧をグループ全体に送信。"""
        users = await get_editing_users(self.swot_id)
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "editing_users_event",
                "editing_users": users,
            }
        )

    async def editing_users_event(self, event):
        await self.send(text_data=json.dumps({
            "type": "editing_users",
            "editingUsers": event["editing_users"],
        }))

    async def _handle_editing_field(self, data):
        """editing_field イベントを Redis 状態に反映してグループへブロードキャスト。"""
        status = data.get("status")
        category = data.get("category")
        index = data.get("index")
        color = data.get("color")

        # category / index が欠けている不正ペイロードは無視
        # (None-None のような壊れた field_key を Redis に残さない)
        if category is None or index is None:
            return

        field_key = f"{category}-{index}"
        # ユーザー名はクライアント送信値ではなく self.username を使う
        username = self.username

        if status == "start":
            await set_field_editor(self.swot_id, field_key, username, color)
        elif status == "stop":
            await remove_field_editor(self.swot_id, field_key)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "editing_field_event",
                "field_key": field_key,
                "username": username,
                "status": status,
                "color": color,
            }
        )

    async def editing_field_event(self, event):
        category, _, index = event["field_key"].partition("-")
        await self.send(text_data=json.dumps({
            "type": "editing_field",
            "category": category,
            "index": index,
            "username": event["username"],
            "status": event["status"],
            "color": event["color"],
        }))
