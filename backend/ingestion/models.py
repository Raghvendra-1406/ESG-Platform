from django.db import models

from tenants.models import Tenant


class DataSourceBatch(models.Model):

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='data_source_batches'
    )

    batch_name = models.CharField(
        max_length=255
    )

    reporting_period = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    uploaded_by = models.CharField(
        max_length=255
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return f"{self.tenant.name} - {self.batch_name}"


class DataSource(models.Model):

    SOURCE_CHOICES = [
        ('SAP', 'SAP'),
        ('UTILITY', 'Utility'),
        ('TRAVEL', 'Travel'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='data_sources'
    )

    batch = models.ForeignKey(
        DataSourceBatch,
        on_delete=models.SET_NULL,
        related_name='data_sources',
        blank=True,
        null=True
    )

    source_type = models.CharField(
        max_length=50,
        choices=SOURCE_CHOICES
    )

    original_file_name = models.CharField(
        max_length=255
    )

    uploaded_file = models.FileField(
        upload_to='uploads/'
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    uploaded_by = models.CharField(
        max_length=255
    )

    status = models.CharField(
        max_length=50,
        default='UPLOADED'
    )

    def __str__(self):

        return (
            f"{self.tenant.name} - "
            f"{self.source_type}"
        )