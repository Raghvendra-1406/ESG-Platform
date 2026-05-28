from .models import AuditLog


def log_record_change(
    record,
    actor=None,
    action_type=None,
    field_name=None,
    old_value=None,
    new_value=None,
    reason_for_change=None,
    previous_state=None,
    new_state=None,
):

    username = 'unknown'
    user_role = None

    if actor and getattr(actor, 'is_authenticated', False):

        username = actor.get_username() or str(actor)
        user_role = getattr(getattr(actor, 'tenant_profile', None), 'role', None)

    return AuditLog.objects.create(
        tenant=record.tenant,
        record=record,
        action=action_type,
        action_type=action_type,
        performed_by=username,
        changed_by_user=actor if actor and getattr(actor, 'is_authenticated', False) else None,
        user_role=user_role,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        reason_for_change=reason_for_change,
        previous_state=previous_state,
        new_state=new_state,
    )