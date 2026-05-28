from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from audits.audit_service import log_record_change
from tenants.services import get_user_role, get_user_tenant, is_platform_admin


def _snapshot(record):

    return {
        'review_status': record.review_status,
        'workflow_status': record.workflow_status,
        'analyst_notes': record.analyst_notes,
        'is_locked': record.is_locked,
    }


def apply_record_filters(queryset, params, user=None):

    if is_platform_admin(user):

        raise PermissionDenied('Platform admins cannot access ESG records.')

    tenant = get_user_tenant(user)
    requested_tenant_id = params.get('tenant') or params.get('tenant_id')

    if not tenant:

        raise PermissionDenied('Tenant scope is required.')

    if requested_tenant_id and str(tenant.id) != str(requested_tenant_id):

        raise PermissionDenied('Cross-tenant access is not allowed.')

    tenant_id = tenant.id if tenant else requested_tenant_id

    if tenant_id:

        queryset = queryset.filter(tenant_id=tenant_id)

    category = params.get('category')
    if category:

        queryset = queryset.filter(category=category)

    scope = params.get('scope')
    if scope:

        queryset = queryset.filter(scope=scope)

    review_status = params.get('review_status')
    if review_status:

        queryset = queryset.filter(review_status=review_status)

    suspicious_flag = params.get('suspicious_only') or params.get('suspicious_flag') or params.get('suspicious')
    if suspicious_flag in ('true', 'True', '1'):

        queryset = queryset.filter(
            Q(suspicious_flag=True)
            | Q(quality_score='LOW')
            | Q(normalization_status='FAILED')
        )

    batch_id = params.get('batch_id')
    if batch_id:

        queryset = queryset.filter(raw_record__data_source__batch_id=batch_id)

    source_type = params.get('source_type')
    if source_type:

        queryset = queryset.filter(raw_record__data_source__source_type=source_type)

    workflow_status = params.get('workflow_status')
    if workflow_status:

        queryset = queryset.filter(workflow_status=workflow_status)

    quality_score = params.get('quality_score')
    if quality_score:

        queryset = queryset.filter(quality_score=quality_score)

    search = (params.get('search') or '').strip()
    if search:
        queryset = queryset.filter(
            Q(raw_record__raw_data__invoice_id__icontains=search)
            | Q(raw_record__raw_data__vendor_name__icontains=search)
            | Q(raw_record__raw_data__plant__icontains=search)
            | Q(raw_record__raw_data__material_type__icontains=search)
            | Q(raw_record__raw_data__travel_mode__icontains=search)
            | Q(raw_record__raw_data__provider__icontains=search)
            | Q(raw_record__raw_data__employee_name__icontains=search)
            | Q(raw_record__data_source__source_type__icontains=search)
            | Q(category__icontains=search)
            | Q(scope__icontains=search)
            | Q(workflow_status__icontains=search)
            | Q(review_status__icontains=search)
            | Q(suspicious_reason__icontains=search)
        )

    date_value = params.get('date')
    if date_value:
        queryset = queryset.filter(Q(updated_at__date=date_value) | Q(created_at__date=date_value) | Q(activity_date__date=date_value))

    current_year = timezone.now().year
    year = params.get('year') or str(current_year)
    month = params.get('month')

    if year:
        try:
            year_value = int(year)
        except (TypeError, ValueError):
            year_value = current_year

        year_filter = Q(activity_date__year=year_value) | Q(created_at__year=year_value)
        queryset = queryset.filter(year_filter)

        if month:
            try:
                month_value = int(month)
            except (TypeError, ValueError):
                month_value = None

            if month_value and 1 <= month_value <= 12:
                month_filter = Q(activity_date__month=month_value) | Q(created_at__month=month_value)
                queryset = queryset.filter(month_filter)

    sort_by = params.get('sort_by') or 'updated_at'
    sort_direction = (params.get('sort_direction') or 'desc').lower()
    direction_prefix = '' if sort_direction == 'asc' else '-'

    sort_fields = {
        'id': f'{direction_prefix}id',
        'updated_at': f'{direction_prefix}updated_at',
        'created_at': f'{direction_prefix}created_at',
        'emission_value': f'{direction_prefix}estimated_emissions',
        'quality_score': f'{direction_prefix}quality_score',
        'workflow_status': f'{direction_prefix}workflow_status',
        'reporting_period': f'{direction_prefix}raw_record__data_source__batch__reporting_period',
        'source_type': f'{direction_prefix}raw_record__data_source__source_type',
        'scope': f'{direction_prefix}scope',
    }
    queryset = queryset.order_by(sort_fields.get(sort_by, f'{direction_prefix}updated_at'), f'{direction_prefix}id')

    return queryset


def review_record(record, actor, review_status=None, workflow_status=None, analyst_notes=None, reason_for_change=None):

    role = get_user_role(actor)

    if is_platform_admin(actor):

        raise PermissionDenied('Platform admins cannot modify records.')

    if not role:

        raise PermissionDenied('A tenant user role is required to modify records.')

    if role == 'AUDITOR':

        raise PermissionDenied('Auditors cannot modify records.')

    if not reason_for_change:

        raise ValidationError({'reason_for_change': 'This field is required.'})

    previous_state = _snapshot(record)

    changed_fields = {}

    if isinstance(workflow_status, str) and workflow_status.upper() in ('UPLOADED', 'VALIDATED', 'NORMALIZED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'LOCKED'):

        changed_fields['workflow_status'] = workflow_status.upper()
        changed_fields['review_status'] = 'PENDING'
    elif isinstance(review_status, str) and review_status.upper() in ('UPLOADED', 'VALIDATED', 'NORMALIZED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'LOCKED'):

        review_status = review_status.upper()
        changed_fields['workflow_status'] = review_status
        changed_fields['review_status'] = 'PENDING'
    elif review_status:

        changed_fields['review_status'] = review_status

        if review_status == 'APPROVED':

            changed_fields['workflow_status'] = 'APPROVED'
        elif review_status == 'REJECTED':

            changed_fields['workflow_status'] = 'REJECTED'
        else:

            changed_fields['workflow_status'] = 'UNDER_REVIEW'

    if analyst_notes is not None:

        changed_fields['analyst_notes'] = analyst_notes

    for field_name, value in changed_fields.items():

        old_value = getattr(record, field_name)
        setattr(record, field_name, value)

        action_type = 'UPDATE' if field_name == 'workflow_status' else 'APPROVE' if value == 'APPROVED' else 'REJECT' if value == 'REJECTED' else 'REVIEW'

        log_record_change(
            record=record,
            actor=actor,
            action_type=action_type,
            field_name=field_name,
            old_value=old_value,
            new_value=value,
            reason_for_change=reason_for_change,
            previous_state=previous_state,
        )

    record.save()

    return record


def lock_record(record, actor, reason_for_change=None):

    role = get_user_role(actor)

    if is_platform_admin(actor):

        raise PermissionDenied('Platform admins cannot modify records.')

    if not role:

        raise PermissionDenied('A tenant user role is required to modify records.')

    if role == 'AUDITOR':

        raise PermissionDenied('Auditors cannot modify records.')

    if role != 'MANAGER':

        raise PermissionDenied('Only managers can lock records.')

    if record.review_status != 'APPROVED':

        raise ValidationError({'detail': 'Only approved records can be locked.'})

    if record.is_locked:

        raise ValidationError({'detail': 'Record is already locked.'})

    previous_state = _snapshot(record)
    record.is_locked = True
    record.workflow_status = 'LOCKED'
    record.save()

    log_record_change(
        record=record,
        actor=actor,
        action_type='LOCK',
        field_name='is_locked',
        old_value=False,
        new_value=True,
        reason_for_change=reason_for_change or 'Locked after approval',
        previous_state=previous_state,
    )

    return record