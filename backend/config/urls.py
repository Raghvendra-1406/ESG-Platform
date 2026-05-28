from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [

    path(
        'admin/',
        admin.site.urls
    ),

    path(
        'api/records/',
        include('records.urls')
    ),
    path(
        'api/ingestion/',
        include('ingestion.urls')
    ),
    path(
        'api/auth/',
        include('authapi.urls')
    ),
    path(
        'api/admin/',
        include('adminapi.urls')
    ),
    path(
        'api/audits/',
        include('audits.urls')
    ),
]


if settings.DEBUG:

    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )