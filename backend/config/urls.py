from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [

    path(
        '',
        RedirectView.as_view(url=settings.FRONTEND_LOGIN_URL, permanent=False)
    ),

    path(
        'admin/',
        admin.site.urls
    ),

    path(
        'api/records/',
        include('backend.records.urls')
    ),
    path(
        'api/ingestion/',
        include('backend.ingestion.urls')
    ),
    path(
        'api/auth/',
        include('backend.authapi.urls')
    ),
    path(
        'api/admin/',
        include('backend.adminapi.urls')
    ),
    path(
        'api/audits/',
        include('backend.audits.urls')
    ),
]


if settings.DEBUG:

    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )