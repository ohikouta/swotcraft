import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# 環境変数の設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

# Django の設定を初期化する
django.setup()

# Django の ASGI アプリケーションを取得
from django.core.asgi import get_asgi_application
# WebSocket ルーティング設定を読み込む（django.setup() 後に行う）
from app.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
