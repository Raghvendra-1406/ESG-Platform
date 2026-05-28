import pandas as pd
from pathlib import Path
from rest_framework.exceptions import ValidationError
from django.db import transaction

from backend.tenants.services import get_user_tenant, get_user_role

from .models import DataSource, DataSourceBatch
from backend.records.validation_service import validate_raw_record


def _default_reporting_period():
    from django.utils import timezone

    return timezone.localdate().strftime('%B %Y')


def _normalize_reporting_period(reporting_period):
    reporting_period = (reporting_period or '').strip()
    if not reporting_period or reporting_period.isdigit():
        return _default_reporting_period()
    return reporting_period


def _latest_upload_batch_queryset(tenant, reporting_period):
    return DataSourceBatch.objects.filter(
        tenant=tenant,
        reporting_period=reporting_period,
    ).order_by('-created_at', '-id')


def get_or_create_upload_batch(tenant, uploaded_by, original_file_name, reporting_period=None):
    reporting_period = _normalize_reporting_period(reporting_period)
    batch = _latest_upload_batch_queryset(tenant, reporting_period).first()
    if batch is None:
        batch = DataSourceBatch.objects.create(
            tenant=tenant,
            reporting_period=reporting_period,
            batch_name=original_file_name,
            uploaded_by=uploaded_by,
        )
    if not batch.batch_name:
        batch.batch_name = original_file_name
        batch.save(update_fields=['batch_name'])
    return batch


def create_data_source(validated_data, user=None):

    role = get_user_role(user)
    if role != 'ANALYST':

        raise ValidationError({'detail': 'Only analysts can upload ESG source data.'})

    if get_user_role(user) == 'PLATFORM_ADMIN':

        raise ValidationError({'detail': 'Platform admins cannot upload ESG source data.'})

    uploaded_file = validated_data['uploaded_file']
    validated_data['original_file_name'] = validated_data.get('original_file_name') or uploaded_file.name

    tenant = validated_data.get('tenant') or get_user_tenant(user)
    if tenant is None:

        raise ValidationError({'tenant': 'Tenant is required.'})

    if tenant is not None:

        validated_data['tenant'] = tenant

    if user and getattr(user, 'is_authenticated', False):

        user_tenant = get_user_tenant(user)

        if user_tenant and validated_data['tenant'].id != user_tenant.id:

            raise ValidationError({'tenant': 'Cross-tenant uploads are not allowed.'})

    validated_data['uploaded_by'] = validated_data.get('uploaded_by') or (user.get_username() if user and getattr(user, 'is_authenticated', False) else 'unknown')

    batch = validated_data.pop('batch', None)
    reporting_period = validated_data.pop('reporting_period', None)
    if batch is None:
        batch = get_or_create_upload_batch(
            tenant=validated_data['tenant'],
            uploaded_by=validated_data['uploaded_by'],
            original_file_name=validated_data['original_file_name'],
            reporting_period=reporting_period,
        )
    elif batch.tenant_id != tenant.id:
        raise ValidationError({'batch': 'Batch tenant does not match the uploaded datasource tenant.'})

    source_type = validated_data['source_type']

    with transaction.atomic():
        existing_source = DataSource.objects.filter(batch=batch, source_type=source_type).first()
        if existing_source:
            existing_source.delete()

        data_source = DataSource.objects.create(batch=batch, **validated_data)
        process_uploaded_csv(data_source, user=user)

    return data_source


def process_uploaded_csv(data_source, user=None):

    file_path = data_source.uploaded_file.path
    suffix = Path(file_path).suffix.lower()

    try:

        if suffix == '.xls':

            df = pd.read_excel(file_path, engine='xlrd')
        elif suffix == '.xlsx':

            df = pd.read_excel(file_path, engine='openpyxl')
        else:

            df = pd.read_csv(file_path)
    except Exception as exc:

        raise ValidationError({'uploaded_file': f'Could not parse the uploaded file: {exc}'}) from exc

    data_source.status = 'UPLOADED'
    data_source.save(update_fields=['status'])

    for _, row in df.iterrows():

        from backend.records.models import RawRecord

        raw_record = RawRecord.objects.create(
            data_source=data_source,
            raw_data=row.to_dict(),
            tenant=data_source.tenant,
        )

        is_valid, _ = validate_raw_record(raw_record)

        if is_valid:

            raw_record.suspicious_flag = False
            raw_record.save(update_fields=['suspicious_flag'])


def normalize_batch(batch, user=None):
    from django.db.models import Q

    source_types = set(batch.data_sources.values_list('source_type', flat=True))
    missing_sources = [source for source in ['SAP', 'UTILITY', 'TRAVEL'] if source not in source_types]
    if missing_sources:
        raise ValidationError({'detail': 'Please upload SAP, Utility, and Travel data before normalization.'})

    raw_records = batch.data_sources.prefetch_related('raw_records').all()
    all_raw_records = []
    for data_source in raw_records:
        all_raw_records.extend(list(data_source.raw_records.all()))

    processed = 0
    for raw_record in all_raw_records:
        if raw_record.validation_status != 'FAILED':
            from backend.records.normalization_service import normalize_raw_record

            normalize_raw_record(raw_record, actor=user)
            processed += 1

    normalized_records = batch.data_sources.model._meta.apps.get_model('records', 'NormalizedRecord').objects.filter(raw_record__data_source__batch=batch)
    suspicious_rows = normalized_records.filter(Q(suspicious_flag=True) | Q(quality_score='LOW')).count()

    for data_source in batch.data_sources.all():
        data_source.status = 'NORMALIZED'
        data_source.save(update_fields=['status'])

    return {
        'batch': batch,
        'processed_rows': processed,
        'total_rows': len(all_raw_records),
        'normalized_records': normalized_records.count(),
        'suspicious_rows': suspicious_rows,
        'source_files': [data_source.original_file_name for data_source in batch.data_sources.all()],
    }