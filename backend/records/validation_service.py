from datetime import datetime

import pandas as pd


REQUIRED_FIELDS = {
    'SAP': ['invoice_id', 'vendor_name', 'plant', 'material_type', 'quantity', 'unit', 'transaction_date'],
    'UTILITY': ['meter_id', 'facility_name', 'electricity_kwh', 'billing_month', 'billing_year', 'provider'],
    'TRAVEL': ['employee_id', 'employee_name', 'travel_mode', 'from_city', 'to_city', 'distance_km', 'travel_date', 'expense_amount'],
}

DATE_FIELDS = {
    'SAP': ['transaction_date'],
    'UTILITY': [],
    'TRAVEL': ['travel_date'],
}


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


def validate_raw_record(raw_record):

    source_type = raw_record.data_source.source_type
    raw_data = raw_record.raw_data or {}

    fatal_issues = []
    warning_issues = []

    for field_name in REQUIRED_FIELDS.get(source_type, []):

        value = raw_data.get(field_name)

        if value in (None, ''):

            fatal_issues.append(f"Missing required field: {field_name}")

    for field_name in DATE_FIELDS.get(source_type, []):

        parsed_date = _parse_date(raw_data.get(field_name))

        if raw_data.get(field_name) not in (None, '') and parsed_date is None:

            fatal_issues.append(f"Malformed date: {field_name}")

    quantity_field = {
        'SAP': 'quantity',
        'UTILITY': 'electricity_kwh',
        'TRAVEL': 'distance_km',
    }.get(source_type)

    quantity_value = raw_data.get(quantity_field) if quantity_field else None

    try:

        quantity = float(quantity_value)
    except (TypeError, ValueError):

        quantity = None

    if quantity is None:

        fatal_issues.append('Invalid quantity value')
    elif quantity < 0:

        warning_issues.append('Negative quantity value')

    duplicate_rows = raw_record.data_source.raw_records.filter(raw_data=raw_data).exclude(id=raw_record.id).exists()
    if duplicate_rows:

        warning_issues.append('Duplicate raw row detected')

    issues = fatal_issues + warning_issues

    if fatal_issues:

        raw_record.ingestion_status = 'FAILED'
        raw_record.validation_status = 'FAILED'
    elif warning_issues:

        raw_record.ingestion_status = 'WARNING'
        raw_record.validation_status = 'WARNING'
    else:

        raw_record.ingestion_status = 'VALIDATED'
        raw_record.validation_status = 'VALID'

    raw_record.validation_errors = issues
    raw_record.save(update_fields=['ingestion_status', 'validation_status', 'validation_errors', 'tenant'])

    return len(fatal_issues) == 0, issues