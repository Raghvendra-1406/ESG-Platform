from django.conf import settings
from django.db import models


class TenantRole(models.TextChoices):
    ANALYST = 'ANALYST', 'Analyst'
    MANAGER = 'MANAGER', 'Manager'
    AUDITOR = 'AUDITOR', 'Auditor'


class Tenant(models.Model):

    name = models.CharField(
        max_length=255
    )

    company_identifier = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True
    )

    industry = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return self.name


class TenantUserProfile(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tenant_profile'
    )

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='user_profiles'
    )

    role = models.CharField(
        max_length=20,
        choices=TenantRole.choices
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return f"{self.user} - {self.tenant} ({self.role})"