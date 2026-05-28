from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q

from .models import (
    RawRecord,
    NormalizedRecord
)

from .serializers import (
    RawRecordSerializer,
    NormalizedRecordSerializer
)

from .workflow_service import (
    apply_record_filters,
    review_record,
    lock_record,
)

from tenants.services import get_user_tenant
from tenants.services import get_user_role
from ingestion.models import DataSourceBatch


def _latest_complete_batch_for_tenant(tenant):
    return (
        DataSourceBatch.objects.filter(tenant=tenant)
        .annotate(
            source_count=Count('data_sources', distinct=True),
            normalized_source_count=Count('data_sources', filter=Q(data_sources__status='NORMALIZED'), distinct=True),
        )
        .filter(source_count__gte=3, normalized_source_count__gte=3)
        .order_by('-created_at', '-id')
        .first()
    )


class RawRecordCreateAPIView(
    APIView
):

    def post(self, request):

        if get_user_role(request.user) != 'ANALYST':

            return Response(

                {
                    "error":
                    "Only analysts can upload ESG source data"
                },

                status=status.HTTP_403_FORBIDDEN
            )

        serializer = (
            RawRecordSerializer(
                data=request.data,
                context={'request': request}
            )
        )

        if serializer.is_valid():

            serializer.save()

            return Response(

                serializer.data,

                status=status.HTTP_201_CREATED
            )

        return Response(

            serializer.errors,

            status=status.HTTP_400_BAD_REQUEST
        )


class NormalizedRecordListAPIView(
    APIView
):

    def get(self, request):

        queryset = (
            NormalizedRecord.objects.select_related(
                'tenant',
                'raw_record__data_source__tenant',
                'raw_record__data_source__batch'
            )
        )

        tenant = get_user_tenant(request.user)
        requested_batch_id = request.GET.get('batch_id')
        if tenant and not requested_batch_id:
            latest_batch = _latest_complete_batch_for_tenant(tenant)
            if latest_batch:
                queryset = queryset.filter(raw_record__data_source__batch=latest_batch)

        queryset = apply_record_filters(
            queryset,
            request.GET,
            user=request.user,
        )

        serializer = (
            NormalizedRecordSerializer(
                queryset,
                many=True
            )
        )

        return Response(
            serializer.data
        )


class NormalizedRecordReviewAPIView(
    APIView
):

    def patch(
        self,
        request,
        record_id
    ):

        tenant = get_user_tenant(request.user)
        tenant_id = tenant.id if tenant else request.data.get('tenant') or request.data.get('tenant_id')

        if not tenant_id:

            return Response(

                {
                    "error":
                    "Tenant scope is required"
                },

                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            lookup = {'id': record_id}

            if tenant_id:

                lookup['tenant_id'] = tenant_id

            record = NormalizedRecord.objects.select_related(
                'tenant',
                'raw_record__data_source__tenant'
            ).get(**lookup)

        except NormalizedRecord.DoesNotExist:

            return Response(

                {
                    "error":
                    "Record not found"
                },

                status=status.HTTP_404_NOT_FOUND
            )

        if record.is_locked:

            return Response(

                {
                    "error":
                    "Record is locked for audit"
                },

                status=status.HTTP_400_BAD_REQUEST
            )

        review_record(
            record=record,
            actor=request.user,
            review_status=request.data.get('review_status'),
            workflow_status=request.data.get('workflow_status'),
            analyst_notes=request.data.get('analyst_notes'),
            reason_for_change=request.data.get('reason_for_change'),
        )

        serializer = (
            NormalizedRecordSerializer(
                record
            )
        )

        return Response(
            serializer.data
        )


class AuditLockAPIView(
    APIView
):

    def patch(
        self,
        request,
        record_id
    ):

        tenant = get_user_tenant(request.user)
        tenant_id = tenant.id if tenant else request.data.get('tenant') or request.data.get('tenant_id')

        if not tenant_id:

            return Response(

                {
                    "error":
                    "Tenant scope is required"
                },

                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            lookup = {'id': record_id}

            if tenant_id:

                lookup['tenant_id'] = tenant_id

            record = NormalizedRecord.objects.select_related(
                'tenant',
                'raw_record__data_source__tenant'
            ).get(**lookup)

        except NormalizedRecord.DoesNotExist:

            return Response(

                {
                    "error":
                    "Record not found"
                },

                status=status.HTTP_404_NOT_FOUND
            )

        lock_record(
            record=record,
            actor=request.user,
            reason_for_change=request.data.get('reason_for_change'),
        )

        serializer = (
            NormalizedRecordSerializer(
                record
            )
        )

        return Response(
            serializer.data
        )