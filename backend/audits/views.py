from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.tenants.services import get_user_tenant, is_platform_admin

from .models import AuditLog


def serialize_audit_log(audit_log):
	return {
		'id': audit_log.id,
		'tenant': {
			'id': audit_log.tenant_id,
			'name': getattr(audit_log.tenant, 'name', None),
		} if audit_log.tenant_id else None,
		'record_id': audit_log.record_id,
		'action': audit_log.action,
		'action_type': audit_log.action_type,
		'performed_by': audit_log.performed_by,
		'changed_by_user': getattr(audit_log.changed_by_user, 'username', None),
		'user_role': audit_log.user_role,
		'field_name': audit_log.field_name,
		'old_value': audit_log.old_value,
		'new_value': audit_log.new_value,
		'reason_for_change': audit_log.reason_for_change,
		'previous_state': audit_log.previous_state,
		'new_state': audit_log.new_state,
		'timestamp': audit_log.timestamp,
	}


class AuditLogListAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		if is_platform_admin(request.user):
			return Response({'detail': 'Platform admins cannot access audit logs.'}, status=403)

		queryset = AuditLog.objects.select_related('tenant', 'record', 'changed_by_user').order_by('-timestamp')

		tenant = get_user_tenant(request.user)
		if not tenant:
			return Response({'detail': 'Tenant scope is required.'}, status=403)
		queryset = queryset.filter(tenant=tenant)

		action_type = request.query_params.get('action_type')
		if action_type:
			queryset = queryset.filter(action_type=action_type)

		record_id = request.query_params.get('record_id')
		if record_id:
			queryset = queryset.filter(record_id=record_id)

		search = (request.query_params.get('search') or '').strip().lower()
		if search:
			queryset = queryset.filter(
				Q(action_type__icontains=search)
				| Q(action__icontains=search)
				| Q(field_name__icontains=search)
				| Q(performed_by__icontains=search)
			)

		year = request.query_params.get('year') or str(timezone.now().year)
		month = request.query_params.get('month')
		try:
			year_value = int(year)
		except (TypeError, ValueError):
			year_value = timezone.now().year

		queryset = queryset.filter(timestamp__year=year_value)
		if month:
			try:
				month_value = int(month)
			except (TypeError, ValueError):
				month_value = None
			if month_value and 1 <= month_value <= 12:
				queryset = queryset.filter(timestamp__month=month_value)

		return Response([serialize_audit_log(audit_log) for audit_log in queryset.distinct()])
