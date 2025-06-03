# WebSocket consumers for handling real-time chat communication using Django Channels.
# References SDD Section 3.3 WebSocket Server & 9.2 WebSocket Message Formats
import json
from channels.generic.websocket import AsyncWebsocketConsumer # Base class for async WebSocket consumers
from channels.db import database_sync_to_async # Allows running synchronous Django ORM queries in async code
from django.contrib.auth import get_user_model # Gets the active User model
from django.utils import timezone # For handling timezones

from .models import Message, Channel, ChannelMember, UserPresence # Chat app models
from .serializers import MessageSerializer # For serializing messages to send to clients

CustomUser = get_user_model() # Get the CustomUser model

# Main WebSocket consumer for chat functionalities.
class ChatConsumer(AsyncWebsocketConsumer):
    # Called when a WebSocket connection is attempted.
    async def connect(self):
        self.user = self.scope.get("user") # Get authenticated user from scope (set by AuthMiddlewareStack)
        if not self.user or not self.user.is_authenticated:
            await self.close() # Close connection if user is not authenticated
            return

        await self.accept() # Accept the WebSocket connection

        # Create a unique room name for this user for direct messages or user-specific notifications.
        self.user_room_name = f'user_{self.user.user_id}'
        # Add this user's connection to their personal group/room.
        await self.channel_layer.group_add(
            self.user_room_name,
            self.channel_name # Unique channel name for this specific WebSocket connection instance
        )
        
        # Update user's presence to 'online' in the database. SDD 6.4
        await self.update_user_presence(self.user, 'online')
        # Broadcast this presence change (implementation of broadcast might vary).
        await self.broadcast_presence(self.user, 'online')

        # Subscribe this user's connection to all channel rooms they are a member of.
        self.joined_channel_rooms = set()
        member_channels = await self.get_user_channels(self.user) # Get list of channel IDs
        for channel_id in member_channels:
            room_name = f'channel_{channel_id}' # Convention for channel room names
            self.joined_channel_rooms.add(room_name)
            await self.channel_layer.group_add(room_name, self.channel_name)
        
        # Send a welcome/authentication confirmation message to the client.
        await self.send(text_data=json.dumps({
            'type': 'authenticated',
            'payload': {'user_id': str(self.user.user_id), 'message': 'Welcome to EduChat!'}
        }))

    # Called when the WebSocket connection is closed.
    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user.is_authenticated:
            # Update user's presence to 'offline'.
            await self.update_user_presence(self.user, 'offline')
            await self.broadcast_presence(self.user, 'offline', timezone.now().isoformat()) # Include last_seen time

            # Remove connection from personal user room.
            if hasattr(self, 'user_room_name'):
                await self.channel_layer.group_discard(
                    self.user_room_name,
                    self.channel_name
                )
            # Remove connection from all joined channel rooms.
            if hasattr(self, 'joined_channel_rooms'):
                for room_name in self.joined_channel_rooms:
                    await self.channel_layer.group_discard(room_name, self.channel_name)

    # Called when a message is received from the WebSocket client.
    async def receive(self, text_data):
        if not self.user.is_authenticated: return # Ignore messages if user somehow not authenticated

        try:
            data = json.loads(text_data) # Parse incoming JSON data
            message_type = data.get('type') # Determine message type from client (e.g., 'send_message')
            payload = data.get('payload', {}) # Get the payload associated with the message

            # Route message to appropriate handler based on type.
            if message_type == 'send_message':
                await self.handle_send_message(payload)
            elif message_type == 'typing_started':
                await self.handle_typing_event(payload, is_typing=True)
            elif message_type == 'typing_stopped':
                await self.handle_typing_event(payload, is_typing=False)
            elif message_type == 'status_update': # Client explicitly updates status (e.g., 'away')
                await self.handle_status_update(payload)
            else:
                await self.send_error("Unknown message type")

        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format.")
        except Exception as e: # Catch-all for other errors
            await self.send_error(f"An error occurred: {str(e)}")

    # Handles 'send_message' type messages from clients.
    async def handle_send_message(self, payload):
        channel_id = payload.get('channel_id')
        content = payload.get('content')

        if not channel_id or not content: # Validate required fields
            await self.send_error("Missing channel_id or content for send_message.")
            return

        # Check if user is a member of the target channel.
        is_member = await self.is_user_member_of_channel(self.user, channel_id)
        if not is_member:
            await self.send_error("You are not authorized to send messages to this channel.")
            return

        # Save the message to the database.
        message = await self.save_message(self.user, channel_id, content)
        # Serialize the message for broadcasting.
        serialized_message = await self.serialize_message_async(message)

        # Broadcast the new message to all members of the channel room. SDD 6.2
        channel_room_name = f'channel_{channel_id}'
        await self.channel_layer.group_send(
            channel_room_name,
            {
                'type': 'chat_message_broadcast', # This maps to the chat_message_broadcast method below
                'message': serialized_message
            }
        )
    
    # Handles 'typing_started' and 'typing_stopped' events.
    async def handle_typing_event(self, payload, is_typing):
        channel_id = payload.get('channel_id')
        if not channel_id:
            await self.send_error("Missing channel_id for typing event.")
            return
        
        is_member = await self.is_user_member_of_channel(self.user, channel_id)
        if not is_member: return # Silently ignore if user is not a member (or send error)

        channel_room_name = f'channel_{channel_id}'
        event_type = 'user_typing' if is_typing else 'user_stopped_typing' # Determine event type for broadcast
        
        # Broadcast typing event to the channel room.
        await self.channel_layer.group_send(
            channel_room_name,
            {
                'type': 'typing_event_broadcast', # Maps to typing_event_broadcast method
                'event_type': event_type,
                'payload': {
                    'channel_id': channel_id,
                    'user_id': str(self.user.user_id),
                    'user_name': self.user.full_name or self.user.email, # User's display name
                }
            }
        )
    
    # Handles client-initiated status updates (e.g., user sets status to 'away').
    async def handle_status_update(self, payload):
        status_val = payload.get('status') 
        if status_val in ['online', 'away']: # 'offline' is typically handled by disconnect
            await self.update_user_presence(self.user, status_val)
            await self.broadcast_presence(self.user, status_val) # Broadcast this new status

    # Method called by channel_layer.group_send when a 'chat_message_broadcast' type message is received.
    # This sends the message data to the specific WebSocket client instance.
    async def chat_message_broadcast(self, event):
        message_data = event['message'] # The message payload from group_send
        await self.send(text_data=json.dumps({
            'type': 'new_message', # Type that the frontend client expects for new messages
            'payload': message_data
        }))

    # Method called for 'typing_event_broadcast'. Sends typing status to the client.
    async def typing_event_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': event['event_type'], # 'user_typing' or 'user_stopped_typing'
            'payload': event['payload']
        }))
        
    # Method called for 'presence_update_broadcast'. Sends presence updates to the client.
    async def presence_update_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update', # Type for presence updates on frontend
            'payload': event['payload']
        }))

    # Helper to send an error message back to the client.
    async def send_error(self, message, code="error"):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'payload': {'message': message, 'code': code}
        }))

    # === Asynchronous Database Helper Methods ===
    # These methods wrap synchronous Django ORM calls in database_sync_to_async
    # to be safely used within the async consumer.

    @database_sync_to_async
    def get_user_channels(self, user_obj): # Renamed user to user_obj to avoid conflict
        return list(ChannelMember.objects.filter(user=user_obj).values_list('channel_id', flat=True))

    @database_sync_to_async
    def is_user_member_of_channel(self, user_obj, channel_id_str): # Renamed user, channel_id
        try:
            channel = Channel.objects.get(channel_id=channel_id_str)
            return ChannelMember.objects.filter(user=user_obj, channel=channel).exists()
        except Channel.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, user_obj, channel_id_str, content_str): # Renamed params
        channel = Channel.objects.get(channel_id=channel_id_str)
        message = Message.objects.create(sender=user_obj, channel=channel, content=content_str)
        return message

    @database_sync_to_async
    def serialize_message_async(self, message_obj): # Renamed message
        # This simplified serialization is used for broadcasting to avoid context issues with DRF serializers in async.
        # It manually constructs the dictionary for the message payload.
        return {
            'message_id': str(message_obj.message_id),
            'channel_id': str(message_obj.channel.channel_id),
            'sender_id': str(message_obj.sender.user_id),
            'sender_name': message_obj.sender.full_name or message_obj.sender.email,
            'sender_avatar': message_obj.sender.profile_picture_url.url if message_obj.sender.profile_picture_url else None,
            'content': message_obj.content,
            'sent_at': message_obj.sent_at.isoformat() # ISO format for timestamps
        }

    @database_sync_to_async
    def update_user_presence(self, user_obj, status_val_str): # Renamed params
        UserPresence.objects.update_or_create(
            user=user_obj, # The user whose presence is being updated
            defaults={'status': status_val_str, 'last_seen_at': timezone.now()} # Data to update or create with
        )

    # Placeholder for a more advanced presence broadcasting mechanism.
    # SDD 6.4 details a flow where presence changes are broadcast to relevant clients.
    # This requires knowing which users are interested in another user's presence (e.g., friends, common channel members).
    # A full implementation might involve a separate presence service or more complex Redis Pub/Sub logic.
    async def broadcast_presence(self, user_obj, status_val_str, last_seen_at_iso_str=None): # Renamed params
        # For MVP, this method might be simplified or its full broadcasting capability deferred.
        # The current consumer mainly updates the DB; clients might fetch presence as needed.
        # If direct broadcasting is implemented, it would involve:
        # 1. Identifying all users who should receive this presence update.
        # 2. Sending a 'presence_update_broadcast' message to each of those users' personal rooms.
        # Example (conceptual, not fully implemented for MVP due to complexity of "relevant users"):
        # relevant_user_ids = await self.get_users_interested_in(user_obj) # This function would need to be defined
        # for uid in relevant_user_ids:
        #     await self.channel_layer.group_send(
        #         f'user_{uid}', 
        #         {
        #             'type': 'presence_update_broadcast', # Maps to presence_update_broadcast method
        #             'payload': {
        #                 'user_id': str(user_obj.user_id),
        #                 'status': status_val_str,
        #                 'last_seen_at': last_seen_at_iso_str or (timezone.now().isoformat() if status_val_str == 'offline' else None)
        #             }
        #         }
        #     )
        pass # Keeping it simple for now, actual broadcast to others is complex
