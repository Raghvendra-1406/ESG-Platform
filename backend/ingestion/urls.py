from django.urls import path

from .views import (
    DataSourceUploadAPIView,
    UploadBatchStatusAPIView,
    NormalizeBatchAPIView,
)

urlpatterns = [

    path(
        'upload/',
        DataSourceUploadAPIView.as_view(),
        name='upload-data-source'
    ),

    path(
        'status/',
        UploadBatchStatusAPIView.as_view(),
        name='upload-batch-status'
    ),

    path(
        'normalize/',
        NormalizeBatchAPIView.as_view(),
        name='normalize-batch'
    ),
]