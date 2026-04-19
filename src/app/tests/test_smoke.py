"""Phase A のスモークテスト。

テスト基盤が動くことと、主要モデルが save/retrieve できることを確認する最小セット。
機能単位のテストは Phase B 以降で拡充していく。
"""
from datetime import date

import pytest
from django.contrib.auth.models import User

from app.models import Project, SWOTAnalysis


@pytest.mark.django_db
def test_user_create_and_retrieve():
    user = User.objects.create_user(username="alice", password="pw12345")
    assert User.objects.get(pk=user.pk).username == "alice"


@pytest.mark.django_db
def test_project_belongs_to_user():
    user = User.objects.create_user(username="bob", password="pw12345")
    project = Project.objects.create(
        name="Test Project",
        start_date=date(2026, 1, 1),
        user=user,
    )
    assert project.user == user
    assert str(project) == "2026 - Test Project"


@pytest.mark.django_db
def test_swot_analysis_linked_to_project():
    user = User.objects.create_user(username="carol", password="pw12345")
    project = Project.objects.create(
        name="P", start_date=date(2026, 1, 1), user=user
    )
    analysis = SWOTAnalysis.objects.create(
        user=user, project=project, title="initial"
    )
    assert analysis.project == project
    assert project.swot_analysis.count() == 1
