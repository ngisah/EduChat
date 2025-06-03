# Defines WebSocket URL patterns for the 'chat' app, mapping paths to consumers.
# For Django Channels
from django.urls import re_path # For regular expression based URL routing
from . import consumers # Import the consumers defined in this app

websocket_urlpatterns = [
    # Maps the 'ws/chat/' WebSocket path to the ChatConsumer.
    re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi()),
    # Example for a channel-specific WebSocket endpoint (not used in current ChatConsumer design which handles multiple channels):
    # re_path(r'ws/chat/(?P<channel_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
