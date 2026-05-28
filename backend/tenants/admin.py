from django.contrib import admin

from .models import Tenant, TenantUserProfile


admin.site.register(Tenant)

admin.site.register(TenantUserProfile)
