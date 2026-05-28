from rest_framework import serializers
from pathlib import Path

from .models import DataSource

from .ingestion_service import create_data_source


class DataSourceUploadSerializer(
    serializers.ModelSerializer
):

    reporting_period = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True)

    SUPPORTED_EXTENSIONS = {'.csv', '.xls', '.xlsx'}

    def validate_uploaded_file(self, uploaded_file):

        extension = Path(uploaded_file.name).suffix.lower()

        if extension not in self.SUPPORTED_EXTENSIONS:

            raise serializers.ValidationError('Only CSV, XLS, and XLSX files are supported.')

        return uploaded_file

    def create(
        self,
        validated_data
    ):

        request = self.context.get('request')
        return create_data_source(validated_data, user=getattr(request, 'user', None))


    class Meta:

        model = DataSource

        fields = '__all__'

        read_only_fields = (

            'original_file_name',

            'uploaded_by',

            'uploaded_at'
        )