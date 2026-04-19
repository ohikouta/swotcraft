"""Redis-backed 共同編集状態管理のユニットテスト。"""
import pytest
import pytest_asyncio
from fakeredis import aioredis as fakeredis_aio

from app import collab_state


@pytest_asyncio.fixture
async def fake_redis():
    """各テストで独立した fakeredis インスタンスを使う。"""
    client = fakeredis_aio.FakeRedis(decode_responses=True)
    collab_state.set_redis_client(client)
    yield client
    await client.aclose()
    collab_state.reset_redis_client()


@pytest.mark.asyncio
async def test_add_and_get_editing_users(fake_redis):
    await collab_state.add_editing_user(42, "alice")
    await collab_state.add_editing_user(42, "bob")

    users = await collab_state.get_editing_users(42)
    assert users == ["alice", "bob"]


@pytest.mark.asyncio
async def test_remove_editing_user(fake_redis):
    await collab_state.add_editing_user(42, "alice")
    await collab_state.add_editing_user(42, "bob")

    await collab_state.remove_editing_user(42, "alice")

    assert await collab_state.get_editing_users(42) == ["bob"]


@pytest.mark.asyncio
async def test_editing_users_are_isolated_per_swot_id(fake_redis):
    """潜在バグ回帰テスト: 異なる swot_id 間で状態が混ざらない。"""
    await collab_state.add_editing_user(1, "alice")
    await collab_state.add_editing_user(2, "bob")

    assert await collab_state.get_editing_users(1) == ["alice"]
    assert await collab_state.get_editing_users(2) == ["bob"]


@pytest.mark.asyncio
async def test_set_and_remove_field_editor(fake_redis):
    await collab_state.set_field_editor(42, "Strength-0", "alice", "#FF5733")
    await collab_state.set_field_editor(42, "Weakness-1", "bob", "#33FF57")

    # 一方を解除しても他方は残る
    await collab_state.remove_field_editor(42, "Strength-0")

    editors = await fake_redis.hgetall("swot:42:field_editors")
    assert "Strength-0" not in editors
    assert "Weakness-1" in editors


@pytest.mark.asyncio
async def test_remove_all_fields_by_user(fake_redis):
    """切断時クリーンアップ: あるユーザーが持つ全フィールドロックを一括解除。"""
    await collab_state.set_field_editor(42, "Strength-0", "alice", "#FF5733")
    await collab_state.set_field_editor(42, "Strength-1", "alice", "#FF5733")
    await collab_state.set_field_editor(42, "Weakness-0", "bob", "#33FF57")

    removed = await collab_state.remove_all_fields_by_user(42, "alice")

    assert set(removed) == {"Strength-0", "Strength-1"}
    remaining = await fake_redis.hgetall("swot:42:field_editors")
    assert set(remaining.keys()) == {"Weakness-0"}


@pytest.mark.asyncio
async def test_field_editors_are_isolated_per_swot_id(fake_redis):
    await collab_state.set_field_editor(1, "Strength-0", "alice", "#FF5733")
    await collab_state.set_field_editor(2, "Strength-0", "bob", "#33FF57")

    # swot 1 のロックを解除しても swot 2 には影響しない
    await collab_state.remove_all_fields_by_user(1, "alice")

    remaining_1 = await fake_redis.hgetall("swot:1:field_editors")
    remaining_2 = await fake_redis.hgetall("swot:2:field_editors")
    assert remaining_1 == {}
    assert "Strength-0" in remaining_2


@pytest.mark.asyncio
async def test_ttl_is_set_on_editing_users_key(fake_redis):
    await collab_state.add_editing_user(42, "alice")
    ttl = await fake_redis.ttl("swot:42:editing_users")
    # TTL が設定されている（-1 = no TTL, -2 = key doesn't exist）
    assert 0 < ttl <= collab_state.EDITING_STATE_TTL


@pytest.mark.asyncio
async def test_ttl_is_set_on_field_editors_key(fake_redis):
    await collab_state.set_field_editor(42, "Strength-0", "alice", "#FF5733")
    ttl = await fake_redis.ttl("swot:42:field_editors")
    assert 0 < ttl <= collab_state.EDITING_STATE_TTL
