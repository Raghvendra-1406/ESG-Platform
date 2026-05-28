from django.contrib import admin

from .models import DataSource, DataSourceBatch


admin.site.register(DataSource)

admin.site.register(DataSourceBatch)