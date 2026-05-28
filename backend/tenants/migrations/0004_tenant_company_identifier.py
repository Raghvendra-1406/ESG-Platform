from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('tenants', '0003_remove_platform_admin_tenant_profiles'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='company_identifier',
            field=models.CharField(blank=True, max_length=100, null=True, unique=True),
        ),
    ]
