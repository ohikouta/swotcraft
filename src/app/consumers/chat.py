import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from ..models import ChatMessage, ChatRoom
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # グループに参加
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f'WebSocket connected. room_name: {self.room_name}')

    async def disconnect(self, close_code):
        # グループから離脱
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f'WebSocket disconnected.')

    # WebSocket からメッセージを受け取ったとき
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        # 認証済みユーザーのみ保存・ブロードキャスト。
        # 未認証リクエストで Anonymous 等の User 行を勝手に作らない。
        user = self.scope.get("user")
        if not (user and user.is_authenticated):
            return
        sender_username = user.username

        await self.save_message(self.room_name, user, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender_username,
            }
        )

    # グループからメッセージを受け取ったとき
    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']
        # WebSocket に送信
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,

        }))

    @database_sync_to_async
    def save_message(self, room_name, sender, message):
        # ChatRoom.room_type は必須フィールドなので defaults で指定。
        # room が未作成の場合のみ作成される。
        room, _ = ChatRoom.objects.get_or_create(
            name=room_name,
            defaults={'room_type': 'project'},
        )
        ChatMessage.objects.create(room=room, sender=sender, message=message)