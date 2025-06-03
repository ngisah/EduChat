from rest_framework import viewsets, permissions, status # DRF ViewSets, permissions, status codes
from rest_framework.decorators import action # For custom actions in ViewSets
from rest_framework.response import Response
from django.db.models import Q # For complex database queries (e.g., OR conditions)
from django.shortcuts import get_object_or_404 # Helper to get an object or raise 404

from .models import Channel, Message, ChannelMember # Chat app models
from users.models import CustomUser # Importing CustomUser model for user-related operations
from .models import ChannelMemberRole # Importing ChannelMemberRole for role management
from .models import ChannelMember # Importing ChannelMember for membership management
from .serializers import ChannelSerializer, MessageSerializer, ChannelMemberSerializer # Chat app serializers
from .permissions import IsChannelMemberOrAdmin, IsChannelAdmin, IsSenderOrChannelAdmin # Custom permission classes

# ViewSet for Channel model, providing CRUD operations and custom actions.
class ChannelViewSet(viewsets.ModelViewSet):
    serializer_class = ChannelSerializer
    permission_classes = [permissions.IsAuthenticated] # Base permission: user must be authenticated

    # Defines the queryset for listing channels. Users can only see channels they are members of.
    def get_queryset(self):
        return self.request.user.chat_channels.distinct().prefetch_related('messages__sender').order_by('-messages__sent_at')

    # Sets the creator of the channel to the currently authenticated user during creation.
    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    # Dynamically sets permission classes based on the action (e.g., update/destroy needs admin).
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'add_member', 'remove_member']:
            self.permission_classes = [permissions.IsAuthenticated, IsChannelAdmin]
        elif self.action in ['retrieve']:
             self.permission_classes = [permissions.IsAuthenticated, IsChannelMemberOrAdmin]
        return super().get_permissions()

    # Custom action to add a member to a channel. URL: POST /api/v1/chat/channels/{channelId}/add_member/
    @action(detail=True, methods=['post'], permission_classes=[IsChannelAdmin]) # Only channel admins can add members
    def add_member(self, request, pk=None): # pk is channel_id
        channel = self.get_object() # Get the Channel instance
        user_id = request.data.get('user_id')
        role = request.data.get('role', ChannelMemberRole.MEMBER)

        if not user_id:
            return Response({"error": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_to_add = CustomUser.objects.get(user_id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if channel.is_private_chat: # Cannot add members to DMs
            return Response({"error": "Cannot add members to a private chat."}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create the channel membership.
        member, created = ChannelMember.objects.get_or_create(
            channel=channel, 
            user=user_to_add,
            defaults={'role_in_channel': role}
        )
        if not created: # If already a member, update their role if specified
            member.role_in_channel = role
            member.save()
            return Response(ChannelMemberSerializer(member).data, status=status.HTTP_200_OK)
        return Response(ChannelMemberSerializer(member).data, status=status.HTTP_201_CREATED)

    # Custom action to remove a member. URL: DELETE /api/v1/chat/channels/{channelId}/members/{userId}/
    @action(detail=True, methods=['delete'], url_path='members/(?P<user_pk>[^/.]+)', permission_classes=[IsChannelAdmin])
    def remove_member(self, request, pk=None, user_pk=None): # pk is channel_id, user_pk is user_id to remove
        channel = self.get_object()
        try:
            user_to_remove = CustomUser.objects.get(user_id=user_pk)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if channel.is_private_chat:
            return Response({"error": "Cannot remove members from a private chat this way."}, status=status.HTTP_400_BAD_REQUEST)
        # Prevent removing the last admin if it's the creator.
        if user_to_remove == channel.creator and ChannelMember.objects.filter(channel=channel, role_in_channel=ChannelMemberRole.ADMIN).count() <= 1:
             return Response({"error": "Cannot remove the only admin (creator). Assign another admin first."}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = ChannelMember.objects.filter(channel=channel, user=user_to_remove).delete()
        if deleted_count == 0:
            return Response({"error": "User is not a member of this channel."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT) # HTTP 204 No Content on successful deletion

    # Custom action to create a one-on-one (DM) chat. URL: POST /api/v1/chat/channels/one-on-one/
    @action(detail=False, methods=['post'], url_path='one-on-one')
    def create_one_on_one(self, request):
        target_user_id = request.data.get('target_user_id')
        if not target_user_id:
            return Response({"error": "target_user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = CustomUser.objects.get(user_id=target_user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Target user not found."}, status=status.HTTP_404_NOT_FOUND)

        current_user = request.user
        if target_user == current_user: # Cannot chat with oneself
            return Response({"error": "Cannot create a chat with yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if a DM channel already exists between these two users.
        existing_channel = Channel.objects.filter(
            is_private_chat=True,
            channelmember__user=current_user # Current user is a member
        ).filter(
            channelmember__user=target_user # Target user is also a member
        ).distinct().first()

        if existing_channel: # If DM exists, return its details
            serializer = self.get_serializer(existing_channel)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # If DM doesn't exist, create a new one.
        channel_name = f"DM between {current_user.email} and {target_user.email}" # Example DM name
        channel_data = {
            'name': channel_name,
            'is_private_chat': True,
            'member_ids': [str(target_user.user_id)] # Pass target user ID to serializer for member creation
        }
        serializer = self.get_serializer(data=channel_data, context={'request': request}) # Pass request to serializer context
        if serializer.is_valid():
            serializer.save() # This will call serializer.create()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ViewSet for Message model, typically nested under a Channel.
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsChannelMemberOrAdmin] # User must be member to list/create messages

    # Defines queryset for listing messages, filtered by channel_pk from URL.
    def get_queryset(self):
        # URL: /api/v1/chat/channels/{channel_pk}/messages/
        channel_id = self.kwargs.get('channel_pk') # Get channel_pk from nested URL
        if channel_id:
            # Ensure user is a member of this channel before listing messages.
            get_object_or_404(ChannelMember, channel_id=channel_id, user=self.request.user)
            queryset = Message.objects.filter(channel_id=channel_id).select_related('sender').order_by('-sent_at') # Newest first
            return queryset
        return Message.objects.none() # Return empty if no channel_pk (should not happen with correct routing)

    # Sets sender and channel automatically when creating a message via API.
    def perform_create(self, serializer):
        channel_id = self.kwargs.get('channel_pk')
        channel = get_object_or_404(Channel, pk=channel_id)
        # Double-check membership before posting (though IsChannelMemberOrAdmin should cover this).
        if not ChannelMember.objects.filter(channel=channel, user=self.request.user).exists():
            raise permissions.PermissionDenied("You are not a member of this channel.")
        message = serializer.save(sender=self.request.user, channel=channel)
        # In a full system, after saving via API, this message would also be broadcast via WebSockets.
        # This is often handled by having the client send messages primarily via WebSocket,
        # and the WebSocket consumer saves and then broadcasts.

    # Sets permissions for update/delete actions (e.g., only sender or admin can modify).
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsSenderOrChannelAdmin]
        return super().get_permissions()