from rest_framework import serializers

from backend.tenants.services import get_user_role
from backend.audits.models import AuditLog

from .models import (
    RawRecord,
    NormalizedRecord
)


class RawRecordSerializer(
    serializers.ModelSerializer
):

    def create(self, validated_data):

        data_source = validated_data.get('data_source')
        request = self.context.get('request')
        role = get_user_role(getattr(request, 'user', None))
        user_tenant = getattr(getattr(request, 'user', None), 'tenant_profile', None)

        if role != 'ANALYST':

            raise serializers.ValidationError({'detail': 'Only analysts can create raw records.'})

        if data_source and validated_data.get('tenant') is None:

            validated_data['tenant'] = data_source.tenant

        if user_tenant and data_source and data_source.tenant_id != user_tenant.tenant_id:

            raise serializers.ValidationError({'tenant': 'Cross-tenant raw record creation is not allowed.'})

        return RawRecord.objects.create(**validated_data)

    class Meta:

        model = RawRecord

        fields = '__all__'


class NormalizedRecordSerializer(
    serializers.ModelSerializer
):

    source_type = serializers.SerializerMethodField()
    source_file = serializers.SerializerMethodField()
    source_system = serializers.SerializerMethodField()
    reporting_period = serializers.SerializerMethodField()
    reporting_year = serializers.SerializerMethodField()
    reporting_month = serializers.SerializerMethodField()
    invoice_id = serializers.SerializerMethodField()
    vendor_name = serializers.SerializerMethodField()
    plant = serializers.SerializerMethodField()
    material_type = serializers.SerializerMethodField()
    transaction_date = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    updated_by = serializers.SerializerMethodField()
    last_modified_by = serializers.SerializerMethodField()

    def _raw_data(self, obj):
        data_source = getattr(getattr(obj, 'raw_record', None), 'data_source', None)
        raw_data = getattr(getattr(obj, 'raw_record', None), 'raw_data', None) or {}
        return data_source, raw_data

    def get_source_type(self, obj):
        data_source, raw_data = self._raw_data(obj)
        return getattr(data_source, 'source_type', None) or raw_data.get('source_system')

    def get_source_file(self, obj):
        data_source, _ = self._raw_data(obj)
        return getattr(data_source, 'original_file_name', None)

    def get_source_system(self, obj):
        return self.get_source_type(obj)

    def get_reporting_period(self, obj):
        data_source, _ = self._raw_data(obj)
        batch = getattr(data_source, 'batch', None)
        return getattr(batch, 'reporting_period', None)

    def get_reporting_year(self, obj):
        period = self.get_reporting_period(obj)
        if not period:
            return None
        parts = str(period).split()
        return parts[-1] if parts and parts[-1].isdigit() else None

    def get_reporting_month(self, obj):
        period = self.get_reporting_period(obj)
        if not period:
            return None
        parts = str(period).split()
        return ' '.join(parts[:-1]) if len(parts) > 1 and parts[-1].isdigit() else None

    def get_invoice_id(self, obj):
        _, raw_data = self._raw_data(obj)
        return raw_data.get('invoice_id') or raw_data.get('document_number')

    def get_vendor_name(self, obj):
        _, raw_data = self._raw_data(obj)
        return raw_data.get('vendor_name') or raw_data.get('vendor')

    def get_plant(self, obj):
        _, raw_data = self._raw_data(obj)
        return raw_data.get('plant') or raw_data.get('plant_code')

    def get_material_type(self, obj):
        _, raw_data = self._raw_data(obj)
        return raw_data.get('material_type') or raw_data.get('activity_type')

    def get_transaction_date(self, obj):
        _, raw_data = self._raw_data(obj)
        return raw_data.get('transaction_date') or raw_data.get('posting_date')

    def _latest_audit(self, obj):
        return AuditLog.objects.filter(record=obj).select_related('changed_by_user').order_by('-timestamp').first()

    def get_created_by(self, obj):
        data_source, _ = self._raw_data(obj)
        return getattr(data_source, 'uploaded_by', None)

    def get_updated_by(self, obj):
        latest = self._latest_audit(obj)
        if latest and latest.changed_by_user:
            return latest.changed_by_user.get_username()
        if latest:
            return latest.performed_by
        return self.get_created_by(obj)

    def get_last_modified_by(self, obj):
        return self.get_updated_by(obj)

    class Meta:

        model = NormalizedRecord

        fields = '__all__'