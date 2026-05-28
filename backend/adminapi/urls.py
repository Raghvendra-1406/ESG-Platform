from django.urls import path

from .views import TenantListAPIView, UserListAPIView

urlpatterns = [
    path('tenants/', TenantListAPIView.as_view(), name='admin-tenants'),
    path('users/', UserListAPIView.as_view(), name='admin-users'),
]
