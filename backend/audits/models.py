from django.conf import settings
from django.db import models

from tenants.models import Tenant
from records.models import NormalizedRecord


class AuditLog(models.Model):

	ACTION_CHOICES = [
		('CREATE', 'Create'),
		('UPDATE', 'Update'),
		('REVIEW', 'Review'),
		('APPROVE', 'Approve'),
		('REJECT', 'Reject'),
		('LOCK', 'Lock'),
	]

	tenant = models.ForeignKey(
		Tenant,
		on_delete=models.CASCADE,
		related_name='audit_logs'
	)

	record = models.ForeignKey(
		NormalizedRecord,
		on_delete=models.CASCADE,
		related_name='audit_logs'
	)

	action = models.CharField(
		max_length=100,
		blank=True,
		null=True
	)

	action_type = models.CharField(
		max_length=20,
		choices=ACTION_CHOICES,
		blank=True,
		null=True
	)

	performed_by = models.CharField(
		max_length=255
	)

	changed_by_user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		related_name='audit_changes',
		blank=True,
		null=True
	)

	user_role = models.CharField(
		max_length=20,
		blank=True,
		null=True
	)

	field_name = models.CharField(
		max_length=255,
		blank=True,
		null=True
	)

	old_value = models.JSONField(
		blank=True,
		null=True
	)

	new_value = models.JSONField(
		blank=True,
		null=True
	)

	reason_for_change = models.TextField(
		blank=True,
		null=True
	)

	timestamp = models.DateTimeField(
		auto_now_add=True
	)

	previous_state = models.JSONField(
		blank=True,
		null=True
	)

	new_state = models.JSONField(
		blank=True,
		null=True
	)

	def save(self, *args, **kwargs):

		if self.tenant_id is None and self.record_id:

			self.tenant = self.record.tenant or self.record.raw_record.tenant

		super().save(*args, **kwargs)

	def __str__(self):

		return (
			f"AuditLog {self.id} - "
			f"{self.action}"
		)
