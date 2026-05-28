from .models import TenantUserProfile


def is_platform_admin(user):
    return bool(user and getattr(user, 'is_authenticated', False) and getattr(user, 'is_superuser', False))


def get_user_profile(user):
    if not user or not getattr(user, 'is_authenticated', False) or is_platform_admin(user):
        return None

    try:
        return user.tenant_profile
    except TenantUserProfile.DoesNotExist:
        return None


def get_user_tenant(user):
    profile = get_user_profile(user)
    return profile.tenant if profile else None


def get_user_role(user):
    if is_platform_admin(user):
        return 'PLATFORM_ADMIN'

    profile = get_user_profile(user)
    return profile.role if profile else None
