from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.tenants.models import Tenant, TenantUserProfile
from backend.tenants.services import is_platform_admin

UserModel = get_user_model()


def serialize_tenant(tenant):
    if tenant is None:
        return None

    return {
        'id': tenant.id,
        'name': tenant.name,
        'company_identifier': tenant.company_identifier,
        'industry': tenant.industry,
        'created_at': tenant.created_at,
    }


def serialize_user(user):
    if user.is_superuser:
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': 'PLATFORM_ADMIN',
            'tenant': None,
            'tenant_profile': None,
            'is_superuser': True,
            'is_platform_admin': True,
        }

    profile = getattr(user, 'tenant_profile', None)
    tenant = getattr(profile, 'tenant', None)

    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': 'PLATFORM_ADMIN' if user.is_superuser else getattr(profile, 'role', None),
        'tenant': serialize_tenant(tenant) if tenant else None,
        'tenant_profile': {
            'role': getattr(profile, 'role', None),
            'tenant': serialize_tenant(tenant) if tenant else None,
        } if profile else None,
        'is_superuser': user.is_superuser,
        'is_platform_admin': user.is_superuser,
    }


class AdminAccessMixin:
    permission_classes = [IsAuthenticated]

    def has_access(self, user):
        return bool(user and (user.is_superuser or is_platform_admin(user)))

    def denied(self):
        return Response({'detail': 'Platform admin access required.'}, status=403)


class TenantListAPIView(AdminAccessMixin, APIView):
    def get(self, request):
        if not self.has_access(request.user):
            return self.denied()

        tenants = Tenant.objects.order_by('name')
        return Response([serialize_tenant(tenant) for tenant in tenants])

    def post(self, request):
        if not self.has_access(request.user):
            return self.denied()

        name = (request.data.get('name') or '').strip()
        company_identifier = (request.data.get('company_identifier') or '').strip() or None
        industry = (request.data.get('industry') or '').strip() or None

        if not name:
            return Response({'name': 'This field is required.'}, status=400)

        tenant = Tenant.objects.create(name=name, company_identifier=company_identifier, industry=industry)
        return Response(serialize_tenant(tenant), status=201)


class UserListAPIView(AdminAccessMixin, APIView):
    def get(self, request):
        if not self.has_access(request.user):
            return self.denied()

        users = UserModel.objects.select_related('tenant_profile__tenant').order_by('username')
        return Response([serialize_user(user) for user in users])

    def post(self, request):
        if not self.has_access(request.user):
            return self.denied()

        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        email = (request.data.get('email') or '').strip()
        full_name = (request.data.get('full_name') or '').strip()
        role = (request.data.get('role') or '').strip()
        tenant_id = request.data.get('tenant_id') or request.data.get('tenant')

        if not username:
            return Response({'username': 'This field is required.'}, status=400)
        if not password:
            return Response({'password': 'This field is required.'}, status=400)
        if not full_name:
            return Response({'full_name': 'This field is required.'}, status=400)
        with transaction.atomic():
            if role == 'PLATFORM_ADMIN':
                if tenant_id:
                    return Response({'tenant_id': 'Platform admins must not belong to a tenant.'}, status=400)

                user = UserModel.objects.create_superuser(username=username, email=email, password=password)
            else:
                if role not in {'ANALYST', 'MANAGER', 'AUDITOR'}:
                    return Response({'role': 'Role must be PLATFORM_ADMIN, ANALYST, MANAGER, or AUDITOR.'}, status=400)

                if not tenant_id:
                    return Response({'tenant_id': 'This field is required.'}, status=400)

                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                except Tenant.DoesNotExist:
                    return Response({'tenant_id': 'Tenant not found.'}, status=404)

                user = UserModel.objects.create_user(username=username, email=email, password=password)
                TenantUserProfile.objects.create(user=user, tenant=tenant, role=role)

            first_name, _, last_name = full_name.partition(' ')
            user.first_name = first_name or full_name
            user.last_name = last_name or ''
            user.save(update_fields=['first_name', 'last_name'])

        return Response(serialize_user(user), status=201)
