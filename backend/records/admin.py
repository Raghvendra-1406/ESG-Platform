from django.contrib import admin


from .models import (
    RawRecord,
    NormalizedRecord
)

admin.site.register(RawRecord)

admin.site.register(NormalizedRecord)