from django.urls import path

from .views import (

    RawRecordCreateAPIView,

    NormalizedRecordListAPIView,

    NormalizedRecordReviewAPIView,

    AuditLockAPIView
)


urlpatterns = [

    path(

        'raw-records/',

        RawRecordCreateAPIView.as_view(),

        name='raw-record-create'
    ),


    path(

        'normalized-records/',

        NormalizedRecordListAPIView.as_view(),

        name='normalized-record-list'
    ),


    path(

        'normalized-records/<int:record_id>/review/',

        NormalizedRecordReviewAPIView.as_view(),

        name='normalized-record-review'
    ),

    path(

        'normalized-records/<int:record_id>/lock/',

        AuditLockAPIView.as_view(),

        name='audit-lock'
    ),
]