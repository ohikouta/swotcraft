import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('app', '0013_swotanalysis_project'),
    ]

    operations = [
        migrations.CreateModel(
            name='SwotHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('change_summary', models.TextField(blank=True, null=True)),
                ('swot', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='history', to='app.swotanalysis')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
