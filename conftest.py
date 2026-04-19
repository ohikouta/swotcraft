"""pytest 全体の事前設定。

Django の settings.py が起動時に必須扱いしている環境変数（SECRET_KEY, REDIS_URL 等）
について、テスト実行時のみ安全なデフォルトをセットする。
"""
import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-production")
os.environ.setdefault("DEBUG", "False")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
