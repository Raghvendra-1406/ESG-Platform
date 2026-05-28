from django.db import models

from tenants.models import Tenant

from ingestion.models import DataSource


class RawRecord(models.Model):

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('VALIDATED', 'Validated'),
        ('WARNING', 'Warning'),
        ('FAILED', 'Failed'),
    ]

    VALIDATION_STATUS_CHOICES = [
        ('VALID', 'Valid'),
        ('WARNING', 'Warning'),
        ('FAILED', 'Failed'),
    ]

    data_source = models.ForeignKey(
        DataSource,
        on_delete=models.CASCADE,
        related_name='raw_records'
    )

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='raw_records',
        blank=True,
        null=True
    )

    raw_data = models.JSONField()

    ingestion_status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    validation_errors = models.JSONField(
        blank=True,
        null=True
    )

    validation_status = models.CharField(
        max_length=20,
        choices=VALIDATION_STATUS_CHOICES,
        default='WARNING'
    )

    suspicious_flag = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"RawRecord {self.id} - "
            f"{self.data_source.source_type}"
        )

    def save(self, *args, **kwargs):

        if self.tenant_id is None and self.data_source_id:

            self.tenant = self.data_source.tenant

        super().save(*args, **kwargs)
    

class NormalizedRecord(models.Model):

    SCOPE_CHOICES = [

        ('SCOPE_1', 'Scope 1'),

        ('SCOPE_2', 'Scope 2'),

        ('SCOPE_3', 'Scope 3'),
    ]


    REVIEW_STATUS_CHOICES = [

        ('PENDING', 'Pending'),

        ('APPROVED', 'Approved'),

        ('REJECTED', 'Rejected'),
    ]


    raw_record = models.OneToOneField(

        RawRecord,

        on_delete=models.CASCADE,

        related_name='normalized_record'
    )

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='normalized_records',
        blank=True,
        null=True
    )


    category = models.CharField(
        max_length=100
    )


    scope = models.CharField(

        max_length=20,

        choices=SCOPE_CHOICES
    )


    normalized_quantity = models.FloatField()


    normalized_unit = models.CharField(
        max_length=50
    )

    activity_type = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    activity_date = models.DateTimeField(
        blank=True,
        null=True
    )

    cost = models.FloatField(
        blank=True,
        null=True
    )

    currency = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    original_unit = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    estimated_emissions = models.FloatField(
        blank=True,
        null=True
    )

    emission_unit = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        default='kgCO2e'
    )

    suspicious_flag = models.BooleanField(
        default=False
    )

    suspicious_reason = models.TextField(
        blank=True,
        null=True
    )

    quality_score = models.CharField(
        max_length=20,
        choices=[
            ('HIGH', 'High'),
            ('MEDIUM', 'Medium'),
            ('LOW', 'Low'),
        ],
        default='MEDIUM'
    )


    review_status = models.CharField(

        max_length=20,

        choices=REVIEW_STATUS_CHOICES,

        default='PENDING'
    )

    workflow_status = models.CharField(
        max_length=20,
        choices=[
            ('UPLOADED', 'Uploaded'),
            ('VALIDATED', 'Validated'),
            ('NORMALIZED', 'Normalized'),
            ('UNDER_REVIEW', 'Under Review'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected'),
            ('LOCKED', 'Locked'),
        ],
        default='UNDER_REVIEW'
    )

    normalization_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('NORMALIZED', 'Normalized'),
            ('FLAGGED', 'Flagged'),
            ('FAILED', 'Failed'),
        ],
        default='PENDING'
    )

    data_quality_flag = models.CharField(
        max_length=20,
        choices=[
            ('CLEAN', 'Clean'),
            ('MISSING_VALUES', 'Missing Values'),
            ('INVALID_ROW', 'Invalid Row'),
            ('SUSPICIOUS', 'Suspicious'),
            ('DUPLICATE', 'Duplicate'),
        ],
        default='CLEAN'
    )

    is_locked = models.BooleanField(
        default=False
    )

    emission_factor = models.FloatField(

        null=True,

        blank=True
    )


    analyst_notes = models.TextField(

        blank=True,

        null=True
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )


    def __str__(self):

        return (

            f"NormalizedRecord "

            f"{self.id} - "

            f"{self.scope}"
        )

    def save(self, *args, **kwargs):

        if self.tenant_id is None and self.raw_record_id:

            self.tenant = self.raw_record.tenant or self.raw_record.data_source.tenant

        super().save(*args, **kwargs)