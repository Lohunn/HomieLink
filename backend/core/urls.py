from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "name": "HomieLink Collaboration API",
        "version": "1.0.0",
        "status": "online",
        "frontend": "http://localhost:5173",
        "endpoints": {
            "auth": "/api/auth/",
            "workspaces": "/api/workspaces/",
            "channels": "/api/channels/",
            "messages": "/api/messages/",
            "projects": "/api/projects/",
            "tasks": "/api/tasks/",
            "ideas": "/api/ideas/",
            "polls": "/api/polls/",
            "activities": "/api/activities/",
            "notifications": "/api/notifications/",
            "search": "/api/search/"
        }
    })

urlpatterns = [
    path('', api_root, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

