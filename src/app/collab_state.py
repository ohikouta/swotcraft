"""共同編集セッションの状態を Redis で管理するモジュール。

以前は SwotCollabConsumer のクラス変数で保持していたため
- プロセス間で状態が共有されない
- 異なる swot_id のセッション間で状態が混ざる（潜在バグ）
- プロセス再起動で状態が消える
という問題があった。Redis に集約してこれらを解消する。

キー設計:
  swot:{swot_id}:editing_users  — Redis Set: 編集中のユーザー名
  swot:{swot_id}:field_editors  — Redis Hash: field_key -> JSON({username, color})

どちらも TTL を設定し、クライアント異常切断でロックが残存しても
一定時間で自動クリーンアップされる。
"""
from __future__ import annotations

import json
import os
import ssl

from redis.asyncio import Redis

# 編集ロックの自動クリーンアップ時間（秒）。
# クライアントの heartbeat を実装するまでの安全策。
EDITING_STATE_TTL = 3600  # 1 hour

_client: Redis | None = None


def get_redis_client() -> Redis:
    """プロセス内で共有する非同期 Redis クライアントを返す。

    `Redis.from_url()` を使うことで REDIS_URL の DB 番号 (`/0`, `/1` など)、
    ポート省略、ユーザー認証情報などを一括で正しく解釈する。
    """
    global _client
    if _client is None:
        url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        ssl_kwargs: dict = {}
        if url.startswith("rediss://"):
            # NOTE: Heroku Key-Value Store の証明書チェーンが完全でない問題への
            # 暫定対応として検証を無効化している。Phase D (Issue #6) の
            # セキュリティ固めで CA 明示 + CERT_REQUIRED に切り替える予定。
            ssl_kwargs["ssl_cert_reqs"] = ssl.CERT_NONE
        _client = Redis.from_url(url, decode_responses=True, **ssl_kwargs)
    return _client


def set_redis_client(client: Redis) -> None:
    """テスト用: Redis クライアントを差し替える。"""
    global _client
    _client = client


def reset_redis_client() -> None:
    """テスト用: キャッシュされた client をクリア。"""
    global _client
    _client = None


def _editing_users_key(swot_id: str | int) -> str:
    return f"swot:{swot_id}:editing_users"


def _field_editors_key(swot_id: str | int) -> str:
    return f"swot:{swot_id}:field_editors"


async def add_editing_user(swot_id: str | int, username: str) -> None:
    client = get_redis_client()
    key = _editing_users_key(swot_id)
    await client.sadd(key, username)
    await client.expire(key, EDITING_STATE_TTL)


async def remove_editing_user(swot_id: str | int, username: str) -> None:
    await get_redis_client().srem(_editing_users_key(swot_id), username)


async def get_editing_users(swot_id: str | int) -> list[str]:
    members = await get_redis_client().smembers(_editing_users_key(swot_id))
    return sorted(members)


async def set_field_editor(
    swot_id: str | int, field_key: str, username: str, color: str | None
) -> None:
    client = get_redis_client()
    key = _field_editors_key(swot_id)
    payload = json.dumps({"username": username, "color": color})
    await client.hset(key, field_key, payload)
    await client.expire(key, EDITING_STATE_TTL)


async def remove_field_editor(swot_id: str | int, field_key: str) -> None:
    await get_redis_client().hdel(_field_editors_key(swot_id), field_key)


async def remove_all_fields_by_user(swot_id: str | int, username: str) -> list[str]:
    """指定ユーザーが編集中のすべてのフィールドロックを解除し、解除したキー一覧を返す。"""
    client = get_redis_client()
    key = _field_editors_key(swot_id)
    editors = await client.hgetall(key)
    removed: list[str] = []
    for field_key, payload in editors.items():
        try:
            info = json.loads(payload)
        except (TypeError, ValueError):
            continue
        if info.get("username") == username:
            await client.hdel(key, field_key)
            removed.append(field_key)
    return removed
