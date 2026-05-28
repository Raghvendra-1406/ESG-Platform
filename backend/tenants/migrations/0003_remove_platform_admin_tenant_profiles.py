from django.db import migrations


def remove_platform_admin_profiles(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    TenantUserProfile = apps.get_model('tenants', 'TenantUserProfile')

    TenantUserProfile.objects.filter(user__in=User.objects.filter(is_superuser=True)).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('tenants', '0002_tenantuserprofile'),
    ]

    operations = [
        migrations.RunPython(remove_platform_admin_profiles, migrations.RunPython.noop),
    ]
