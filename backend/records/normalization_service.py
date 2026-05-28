from datetime import datetime

import pandas as pd
from rest_framework.exceptions import ValidationError

from backend.audits.audit_service import log_record_change
from .models import NormalizedRecord


SOURCE_MAPPING = {
    'SAP': {
        'quantity': ['quantity', 'Menge'],
        'unit': ['unit', 'Einheit'],
        'activity_date': ['transaction_date', 'posting_date', 'Buchungsdatum'],
        'activity_type': ['material_type', 'fuel_type', 'Kraftstofftyp'],
        'cost': ['cost', 'amount'],
        'document_number': ['document_number', 'invoice_id', 'invoice_no', 'Belegnummer'],
        'vendor': ['vendor', 'vendor_name', 'Lieferant'],
        'currency': ['currency', 'Waehrung', 'Währung'],
        'plant_code': ['plant_code', 'plant', 'Werk'],
    },
    'UTILITY': {
        'quantity': ['electricity_kwh', 'kwh_usage', 'Usage_kWh', 'electricity_consumption'],
        'unit': ['unit', 'UoM'],
        'activity_date': ['billing_month'],
        'activity_type': ['provider', 'tariff', 'service_type'],
        'cost': ['amount', 'cost'],
        'meter_id': ['meter_id', 'Zählernummer', 'Zaehlernummer'],
        'facility_name': ['facility_name', 'site_name'],
    },
    'TRAVEL': {
        'quantity': ['distance_km', 'distance', 'DistanceKM'],
        'unit': ['unit', 'distance_unit'],
        'activity_date': ['travel_date', 'departure_date'],
        'activity_type': ['travel_mode', 'travel_type', 'category'],
        'cost': ['expense_amount', 'cost', 'amount'],
        'currency': ['currency'],
        'employee_id': ['employee_id'],
        'origin': ['origin', 'from'],
        'destination': ['destination', 'to'],
    },
}

EMISSION_FACTORS = {
    'SCOPE_1': {
        'L': 2.68,
    },
    'SCOPE_2': {
        'kWh': 0.4,
    },
    'SCOPE_3': {
        'km': 0.12,
    },
}


def _pick_value(raw_data, aliases, default=None):

    for alias in aliases:

        if alias in raw_data and raw_data[alias] not in (None, ''):

            return raw_data[alias]

    return default


def _to_float(value):

    if value in (None, ''):

        return None

    try:

        return float(value)
    except (TypeError, ValueError):

        return None


def _parse_date(value):

    if value in (None, ''):

        return None

    parsed = pd.to_datetime(value, errors='coerce')
    if pd.isna(parsed):

        return None

    if isinstance(parsed, pd.Timestamp):

        return parsed.to_pydatetime()

    if isinstance(parsed, datetime):

        return parsed

    return None


def _quality_score(validation_status, suspicious_flag, warning_count):

    if validation_status == 'FAILED':

        return 'LOW'

    if suspicious_flag or warning_count >= 2:

        return 'LOW'

    if warning_count == 1:

        return 'MEDIUM'

    return 'HIGH'


def _map_unit_and_quantity(source_type, quantity, unit):

    original_quantity = quantity
    original_unit = unit or ''
    normalized_quantity = quantity
    normalized_unit = original_unit

    if source_type == 'SAP':

        if original_unit in ('KL', 'kL'):

            normalized_quantity = quantity * 1000
            normalized_unit = 'L'
        elif original_unit in ('L', 'Liters', 'Liter', 'liters'):

            normalized_unit = 'L'
        elif original_unit in ('gallon', 'gallons'):

            normalized_quantity = quantity * 3.78541
            normalized_unit = 'L'

    elif source_type == 'UTILITY':

        if not original_unit:

            normalized_unit = 'kWh'
        elif original_unit == 'MWh':

            normalized_quantity = quantity * 1000
            normalized_unit = 'kWh'

    elif source_type == 'TRAVEL':

        if not original_unit:

            normalized_unit = 'km'
        elif original_unit == 'miles':

            normalized_quantity = quantity * 1.60934
            normalized_unit = 'km'

    return original_quantity, original_unit, normalized_quantity, normalized_unit


def _classify(source_type):

    if source_type == 'SAP':

        return 'Fuel', 'SCOPE_1'
    if source_type == 'UTILITY':

        return 'Electricity', 'SCOPE_2'
    if source_type == 'TRAVEL':

        return 'Travel', 'SCOPE_3'

    return 'Other', ''


def _emission_estimate(scope, normalized_quantity, normalized_unit):

    factor = EMISSION_FACTORS.get(scope, {}).get(normalized_unit)
    if factor is None or normalized_quantity is None:

        return None, None, None

    return factor, normalized_quantity * factor, 'kgCO2e'


def _suspicious_checks(source_type, raw_record, quantity, normalized_quantity):

    reasons = []
    raw_data = raw_record.raw_data or {}

    if quantity is not None and quantity < 0:

        reasons.append('Negative quantity')

    if normalized_quantity is not None and normalized_quantity > 10000:

        reasons.append('Abnormally high quantity')

    if source_type == 'SAP' and _pick_value(raw_data, SOURCE_MAPPING['SAP']['document_number']):

        document_number = _pick_value(raw_data, SOURCE_MAPPING['SAP']['document_number'])
        duplicates = raw_record.data_source.raw_records.filter(
            raw_data__document_number=document_number,
        ).exclude(id=raw_record.id).exists()
        if duplicates:

            reasons.append('Duplicate invoice or document number')

    if source_type == 'UTILITY':

        start_date = _parse_date(_pick_value(raw_data, ['billing_start']))
        end_date = _parse_date(_pick_value(raw_data, ['billing_end']))
        if start_date and end_date and start_date > end_date:

            reasons.append('Overlapping or invalid billing period')

    if source_type == 'TRAVEL':

        if normalized_quantity is not None and normalized_quantity > 40000:

            reasons.append('Impossible travel distance')

    return reasons


def normalize_raw_record(raw_record, actor=None):

    raw_data = raw_record.raw_data or {}
    source_type = raw_record.data_source.source_type
    mapping = SOURCE_MAPPING.get(source_type, {})

    mapped_quantity = _to_float(_pick_value(raw_data, mapping.get('quantity', [])))
    mapped_unit = _pick_value(raw_data, mapping.get('unit', []), '')

    if source_type == 'UTILITY' and not mapped_unit:
        mapped_unit = 'kWh'
    if source_type == 'TRAVEL' and not mapped_unit:
        mapped_unit = 'km'

    if mapped_quantity is None:

        raise ValidationError({'quantity': 'Quantity could not be parsed.'})

    original_quantity, original_unit, normalized_quantity, normalized_unit = _map_unit_and_quantity(
        source_type,
        mapped_quantity,
        mapped_unit,
    )

    category, scope = _classify(source_type)
    activity_date = _parse_date(_pick_value(raw_data, mapping.get('activity_date', [])))
    if source_type == 'UTILITY' and activity_date is None:
        month = _pick_value(raw_data, ['billing_month'])
        year = _pick_value(raw_data, ['billing_year'])
        if month and year:
            activity_date = _parse_date(f'1 {month} {year}')
    activity_type = _pick_value(raw_data, mapping.get('activity_type', []), category)
    cost = _to_float(_pick_value(raw_data, mapping.get('cost', [])))
    currency = _pick_value(raw_data, mapping.get('currency', []), None)
    warning_count = 0

    if raw_record.validation_status == 'WARNING':

        warning_count += 1

    suspicious_reasons = _suspicious_checks(source_type, raw_record, mapped_quantity, normalized_quantity)
    suspicious_flag = bool(suspicious_reasons)
    if suspicious_flag:

        warning_count += 1

    quality_score = _quality_score(raw_record.validation_status, suspicious_flag, warning_count)
    normalization_status = 'NORMALIZED' if raw_record.validation_status != 'FAILED' else 'FAILED'
    workflow_status = 'UNDER_REVIEW'
    emission_factor, estimated_emissions, emission_unit = _emission_estimate(scope, normalized_quantity, normalized_unit)

    normalized_record, created = NormalizedRecord.objects.update_or_create(
        raw_record=raw_record,
        defaults={
            'tenant': raw_record.tenant,
            'category': category,
            'scope': scope,
            'normalized_quantity': normalized_quantity,
            'normalized_unit': normalized_unit,
            'activity_type': activity_type,
            'activity_date': activity_date,
            'cost': cost,
            'currency': currency,
            'original_unit': original_unit,
            'emission_factor': emission_factor,
            'estimated_emissions': estimated_emissions,
            'emission_unit': emission_unit,
            'suspicious_flag': suspicious_flag,
            'suspicious_reason': '; '.join(suspicious_reasons) if suspicious_reasons else None,
            'quality_score': quality_score,
            'data_quality_flag': 'SUSPICIOUS' if suspicious_flag else ('MISSING_VALUES' if raw_record.validation_status == 'WARNING' else 'CLEAN'),
            'normalization_status': normalization_status,
            'workflow_status': workflow_status,
            'review_status': 'PENDING',
        },
    )

    normalized_record.activity_type = activity_type
    normalized_record.activity_date = activity_date
    normalized_record.cost = cost
    normalized_record.currency = currency
    normalized_record.save(update_fields=[
        'tenant',
        'category',
        'scope',
        'normalized_quantity',
        'normalized_unit',
        'activity_type',
        'activity_date',
        'cost',
        'currency',
        'original_unit',
        'emission_factor',
        'estimated_emissions',
        'emission_unit',
        'suspicious_flag',
        'suspicious_reason',
        'quality_score',
        'data_quality_flag',
        'normalization_status',
        'workflow_status',
        'review_status',
        'updated_at',
    ])

    log_record_change(
        record=normalized_record,
        actor=actor,
        action_type='CREATE' if created else 'UPDATE',
        field_name='normalized_record',
        old_value=None,
        new_value={
            'category': category,
            'scope': scope,
            'normalized_quantity': normalized_quantity,
            'normalized_unit': normalized_unit,
            'quality_score': quality_score,
            'suspicious_reason': normalized_record.suspicious_reason,
        },
        reason_for_change='Initial normalization from uploaded source data',
        new_state={
            'category': category,
            'scope': scope,
            'normalized_quantity': normalized_quantity,
            'normalized_unit': normalized_unit,
            'quality_score': quality_score,
            'workflow_status': workflow_status,
        },
    )

    return normalized_record
