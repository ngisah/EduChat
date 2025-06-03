# Main URL configuration for the entire Django project.
# It includes URL patterns from the admin site and other applications ('users', 'chat').
from django.contrib import admin
from django.urls import path, include # For defining URL patterns and including other URLconfs
from django.conf import settings # To access project settings (e.g., DEBUG)
from django.conf.urls.static import static # Helper for serving media/static files during development

urlpatterns = [
    path('admin/', admin.site.urls), # URL for Django admin interface
    # Include URL patterns from the 'users' app, namespaced as 'users_api'.
    path('api/v1/users/', include('users.urls', namespace='users_api')),
    # Include URL patterns from the 'chat' app, namespaced as 'chat_api'.
    path('api/v1/chat/', include('chat.urls', namespace='chat_api')),
]

# Serve media and static files during development if DEBUG is True.
# In production, these are typically served by a dedicated web server (e.g., Nginx) or CDN.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) # For user-uploaded media files
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) # For static assets
