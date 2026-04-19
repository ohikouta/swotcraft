# Manually added for Django 4.2.7 on 2026-04-19
# 旧 SWOT / SwotIdeas モデル（デッドコード）を削除する migration。
# 新 SWOTAnalysis / SWOTItem 系統にフル移行済みで、
# views / serializers / consumers / frontend いずれからも参照されていないことを
# grep で確認した上で削除。

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0014_swothistory'),
    ]

    operations = [
        # SwotIdeas は SWOT への FK を持つので先に削除する
        migrations.DeleteModel(
            name='SwotIdeas',
        ),
        migrations.DeleteModel(
            name='SWOT',
        ),
    ]
