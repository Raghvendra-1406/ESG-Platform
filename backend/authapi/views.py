from django.contrib.auth import authenticate, get_user_model, login, logout
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

UserModel = get_user_model()


def serialize_tenant_profile(user):
    if getattr(user, 'is_superuser', False):
        return {
            'tenant': None,
            'role': 'PLATFORM_ADMIN',
        }

    profile = getattr(user, 'tenant_profile', None)
    tenant = getattr(profile, 'tenant', None)

    return {
        'tenant': {
            'id': tenant.id,
            'name': tenant.name,
            'industry': tenant.industry,
        } if tenant else None,
        'role': profile.role if profile else None,
    }


def serialize_user(user):
    profile = serialize_tenant_profile(user)
    tenant = profile['tenant']
    role = profile['role']

    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_superuser': user.is_superuser,
        'is_platform_admin': user.is_superuser,
        'role': 'PLATFORM_ADMIN' if user.is_superuser else role,
        'tenant': tenant,
        'tenant_name': tenant['name'] if tenant else None,
        'tenant_profile': None if user.is_superuser else profile,
    }


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = (request.data.get('username') or request.data.get('email') or '').strip()
        password = request.data.get('password') or ''

        if not identifier or not password:
            return Response({'detail': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=identifier, password=password)

        if user is None:
            matched_user = UserModel.objects.filter(email__iexact=identifier).first()
            if matched_user is not None:
                user = authenticate(request, username=matched_user.username, password=password)

        if user is None:
            return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_400_BAD_REQUEST)

        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                'token': token.key,
                'user': serialize_user(user),
            },
            status=status.HTTP_200_OK,
        )


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(serialize_user(request.user))


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.auth is not None and hasattr(request.auth, 'delete'):
            request.auth.delete()
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)
