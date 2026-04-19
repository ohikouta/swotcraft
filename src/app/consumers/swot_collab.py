# app/consumers/swot_collab.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SwotCollabConsumer(AsyncWebsocketConsumer):
    current_editing_users = set()  
    # どのフィールドを誰が編集中かを管理する辞書
    # 例: { "Strength-0": {"username": "Alice", "color": "#FF5733"}, ... }
    field_editors = {}

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
        self.current_editing_users.discard(self.username)
        # field_editors からも、このユーザーが編集中のフィールドを削除
        # (必要に応じて一括で削除する処理)
        to_remove = []
        for field_key, editor_info in self.field_editors.items():
            if editor_info["username"] == self.username:
                to_remove.append(field_key)
        for key in to_remove:
            del self.field_editors[key]

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
        print(f"[SwotCollabConsumer] Received event: {event_type}")

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
            # 既存の編集中ユーザー管理
            self.current_editing_users.add(data.get("username"))
            await self.send_editing_users()
        elif event_type == "editing_stop":
            self.current_editing_users.discard(data.get("username"))
            await self.send_editing_users()

        elif event_type == "editing_field":
            # 新規：ユーザーが特定のフィールドを編集中
            await self.handle_editing_field(data)

        elif event_type in ("online", "offline"):
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "user_status",
                    "username": data.get("username"),
                    "status": event_type,
                }
            )
        else:
            print("SwotCollabConsumer received unknown event type:", event_type)

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

    async def send_editing_users(self):
        """編集中のユーザー一覧をグループ全体に送信"""
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "editing_users_event",
                "editing_users": list(self.current_editing_users),
            }
        )

    async def editing_users_event(self, event):
        """editing_users イベントを各クライアントへブロードキャスト"""
        await self.send(text_data=json.dumps({
            "type": "editing_users",
            "editingUsers": event["editing_users"],
        }))

    # 新規：editing_field イベントの処理
    async def handle_editing_field(self, data):
        """
        data = {
          "type": "editing_field",
          "category": "...",
          "index": 0,
          "username": "...",
          "status": "start" or "stop",
          "color": "#FF5733" (任意)
        }
        """
        status = data.get("status")
        category = data.get("category")
        index = data.get("index")
        username = data.get("username")
        color = data.get("color")

        field_key = f"{category}-{index}"

        if status == "start":
            # ユーザーがこのフィールドを編集中
            self.field_editors[field_key] = {
                "username": username,
                "color": color
            }
        elif status == "stop":
            # 編集中解除
            if field_key in self.field_editors:
                del self.field_editors[field_key]

        # グループ全体にブロードキャスト
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "editing_field_event",
                "field_key": field_key,
                "username": username,
                "status": status,
                "color": color
            }
        )

    # editing_field_event ハンドラー
    async def editing_field_event(self, event):
        """
        受け取った field_key と username, status, color をそのままクライアントに送る
        """
        await self.send(text_data=json.dumps({
            "type": "editing_field",
            "category": event["field_key"].split("-")[0],
            "index": event["field_key"].split("-")[1],
            "username": event["username"],
            "status": event["status"],
            "color": event["color"],
        }))
