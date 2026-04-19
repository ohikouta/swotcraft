"""pytest 用 Django 設定。

通常の settings.py を import した上で、外部サービス依存（Redis, 本番 DB）を
インメモリ実装で上書きし、テスト実行が外部環境に依存しないようにする。
"""
import os

# settings.py 側の Redis 実接続確認（ping）をスキップ
os.environ.setdefault("SKIP_REDIS_CHECK", "1")

from .settings import *  # noqa: E402,F401,F403

# Channels のレイヤーをインメモリに（redis サーバー不要）
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# DB はインメモリ SQLite で完結
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# パスワードハッシュを高速化（テスト用）
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
