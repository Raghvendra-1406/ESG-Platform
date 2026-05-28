from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.utils import timezone

from .serializers import (
    DataSourceUploadSerializer
)
from .ingestion_service import get_or_create_upload_batch, normalize_batch
from .models import DataSourceBatch
from records.models import RawRecord, NormalizedRecord
from tenants.services import get_user_tenant, get_user_role


def _reporting_period_from_request(request):
    reporting_period = (request.data.get('reporting_period') or request.query_params.get('reporting_period') or '').strip()
    if reporting_period:
        return reporting_period

    year = request.data.get('year') or request.query_params.get('year') or timezone.localdate().year
    month = request.data.get('month') or request.query_params.get('month')
    try:
        year_value = int(year)
    except (TypeError, ValueError):
        year_value = timezone.localdate().year

    if month:
        try:
            month_value = int(month)
        except (TypeError, ValueError):
            month_value = None
        if month_value and 1 <= month_value <= 12:
            return timezone.datetime(year_value, month_value, 1).strftime('%B %Y')

    return timezone.localdate().strftime('%B %Y')


def _serialize_source_status(data_source):
    return {
        'source_type': data_source.source_type,
        'status': data_source.status,
        'file_name': data_source.original_file_name,
        'uploaded_at': data_source.uploaded_at,
        'rows_uploaded': data_source.raw_records.count(),
    }


class DataSourceUploadAPIView(
    APIView
):

    def post(self, request):
        serializer = (
            DataSourceUploadSerializer(
                data=request.data,
                context={'request': request}
            )
        )

        if serializer.is_valid():

            data_source = serializer.save()

            batch = data_source.batch
            raw_records = RawRecord.objects.filter(data_source__batch=batch)
            failed_rows = raw_records.filter(validation_status='FAILED').count()

            return Response(

                {
                    'message': 'File uploaded and processed',
                    'source_type': data_source.source_type,
                    'file_name': data_source.original_file_name,
                    'rows_uploaded': raw_records.filter(data_source=data_source).count(),
                    'failed_rows': failed_rows,
                    'reporting_period': getattr(batch, 'reporting_period', None),
                    'batch_id': batch.id,
                    'status': data_source.status,
                },

                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class UploadBatchStatusAPIView(APIView):

    def get(self, request):
        tenant = get_user_tenant(request.user)
        if not tenant:
            return Response({'detail': 'Tenant scope is required.'}, status=status.HTTP_403_FORBIDDEN)

        reporting_period = _reporting_period_from_request(request)
        batch = DataSourceBatch.objects.filter(tenant=tenant, reporting_period=reporting_period).order_by('-created_at').first()

        sources = []
        uploaded_types = set()
        if batch:
            for data_source in batch.data_sources.order_by('source_type'):
                sources.append(_serialize_source_status(data_source))
                uploaded_types.add(data_source.source_type)

        all_sources = ['SAP', 'UTILITY', 'TRAVEL']
        for source_type in all_sources:
            if source_type not in uploaded_types:
                sources.append({
                    'source_type': source_type,
                    'status': 'PENDING',
                    'file_name': None,
                    'uploaded_at': None,
                    'rows_uploaded': 0,
                })

        return Response({
            'reporting_period': reporting_period,
            'batch_id': batch.id if batch else None,
            'sources': sorted(sources, key=lambda item: all_sources.index(item['source_type'])),
            'can_normalize': all(source.get('status') != 'PENDING' for source in sources),
        })


class NormalizeBatchAPIView(APIView):

    def post(self, request):
        if get_user_role(request.user) != 'ANALYST':
            return Response({'detail': 'Only analysts can normalize ESG source data.'}, status=status.HTTP_403_FORBIDDEN)

        tenant = get_user_tenant(request.user)
        if not tenant:
            return Response({'detail': 'Tenant scope is required.'}, status=status.HTTP_403_FORBIDDEN)

        reporting_period = _reporting_period_from_request(request)
        batch = DataSourceBatch.objects.filter(tenant=tenant, reporting_period=reporting_period).order_by('-created_at').first()
        if not batch:
            return Response({'detail': 'Please upload SAP, Utility, and Travel data before normalization.'}, status=status.HTTP_400_BAD_REQUEST)

        source_types = set(batch.data_sources.values_list('source_type', flat=True))
        if not {'SAP', 'UTILITY', 'TRAVEL'}.issubset(source_types):
            return Response({'detail': 'Please upload SAP, Utility, and Travel data before normalization.'}, status=status.HTTP_400_BAD_REQUEST)

        summary = normalize_batch(batch, user=request.user)
        failed_rows = RawRecord.objects.filter(data_source__batch=batch, validation_status='FAILED').count()
        quality_score = max(0, 100 - (summary['suspicious_rows'] * 16) - (failed_rows * 20))

        return Response({
            'message': 'Normalization completed',
            'reporting_period': reporting_period,
            'source_files': summary['source_files'],
            'rows_processed': summary['processed_rows'],
            'normalized_records': summary['normalized_records'],
            'failed_rows': failed_rows,
            'suspicious_rows': summary['suspicious_rows'],
            'quality_score': quality_score,
        }, status=status.HTTP_200_OK)