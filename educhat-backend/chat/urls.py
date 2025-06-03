from django.urls import path, include
from rest_framework_nested import routers # For creating nested URLs like /channels/{id}/messages/
from .views import ChannelViewSet, MessageViewSet

# Router for top-level 'channels' endpoint.
router = routers.SimpleRouter()
router.register(r'channels', ChannelViewSet, basename='channel') # Maps to ChannelViewSet

# Nested router for 'messages' under a specific channel.
# Generates URLs like: /api/v1/chat/channels/{channel_pk}/messages/
channels_router = routers.NestedSimpleRouter(router, r'channels', lookup='channel') # 'channel' is the lookup field for parent
channels_router.register(r'messages', MessageViewSet, basename='channel-messages') # Maps to MessageViewSet

app_name = 'chat'

urlpatterns = [
    path('', include(router.urls)), # Include URLs from the primary router
    path('', include(channels_router.urls)), # Include URLs from the nested router
]
