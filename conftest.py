"""pytest 全体の事前設定。

Django の settings.py が import 時に必須扱いしている環境変数（SECRET_KEY, REDIS_URL 等）
について、テスト実行時のみ安全なデフォルトをセットする。

`DJANGO_SETTINGS_MODULE` は pytest.ini で `config.settings_test` を指定しており、
そこで Redis / DB / Channels レイヤーをテスト用に上書きしている。
"""
import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-production")
os.environ.setdefault("DEBUG", "False")
# settings.py の config("REDIS_URL") が import 時に必須なので値は入れる。
# 実接続は settings_test.py が SKIP_REDIS_CHECK=1 を先に入れているためスキップされる。
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
