from rest_framework import serializers
from .models import Channel, ChannelMember, ChannelMemberRole, Message
from users.models import CustomUser # Import the custom user model
from users.serializers import UserSerializer # Reuse UserSerializer for nested user data

# Serializer for the Message model.
class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True) # Nested UserSerializer for sender details (read-only in response)
    sender_id = serializers.UUIDField(write_only=True) # For client to specify sender when creating (though usually set by server)

    class Meta:
        model = Message
        fields = ['message_id', 'channel', 'sender', 'sender_id', 'content', 'sent_at']
        read_only_fields = ['message_id', 'sender', 'sent_at'] # These fields are set by server or DB

    # Handles creation of a Message instance.
    def create(self, validated_data):
        # sender_id is typically overridden by request.user in the view or consumer.
        return Message.objects.create(**validated_data)

# Serializer for the ChannelMember model.
class ChannelMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True) # Nested UserSerializer for member details
    user_id = serializers.UUIDField(write_only=True) # For specifying user when adding member

    class Meta:
        model = ChannelMember
        fields = ['user', 'user_id', 'role_in_channel', 'joined_at']


# Serializer for the Channel model.
class ChannelSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True) # Nested UserSerializer for creator details
    member_ids = serializers.ListField( # For client to provide list of user UUIDs to add as members on creation
        child=serializers.UUIDField(), write_only=True, required=False
    )
    last_message = serializers.SerializerMethodField(read_only=True) # Dynamically gets the last message for display in chat lists

    class Meta:
        model = Channel
        fields = [
            'channel_id', 'name', 'description', 'creator', 
            'is_private_chat', 'created_at', 'member_ids', 'last_message'
        ]
        read_only_fields = ['channel_id', 'creator', 'created_at', 'last_message']

    # Method to get the last message of a channel.
    def get_last_message(self, obj): # obj is the Channel instance
        last_msg = obj.messages.order_by('-sent_at').first() # Get the most recent message
        if last_msg:
            return MessageSerializer(last_msg).data # Serialize it
        return None

    # Handles creation of a Channel instance.
    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', []) # Extract member_ids
        creator = self.context['request'].user # Get creator from request context (passed by view)
        validated_data['creator'] = creator
        
        # Special handling for private chats (direct messages).
        if validated_data.get('is_private_chat', False):
            if len(member_ids) != 1: # DMs should have exactly one other member
                raise serializers.ValidationError("Private chats must have exactly one other member.")
            other_user_id = member_ids[0]
            try:
                other_user = CustomUser.objects.get(user_id=other_user_id)
                # Auto-generate name for DMs based on the other user's name/email.
                validated_data['name'] = f"DM with {other_user.full_name if other_user.full_name else other_user.email}"
            except CustomUser.DoesNotExist:
                 raise serializers.ValidationError("Other user for private chat not found.")
            
        channel = Channel.objects.create(**validated_data) # Create the channel
        
        # Add creator as a member (admin for groups, member for DMs).
        ChannelMember.objects.create(
            channel=channel, 
            user=creator, 
            role_in_channel=ChannelMemberRole.ADMIN if not channel.is_private_chat else ChannelMemberRole.MEMBER
        )
        # Add other specified members.
        for member_id in member_ids:
            try:
                user_to_add = CustomUser.objects.get(user_id=member_id)
                if user_to_add != creator: # Avoid adding creator twice
                    ChannelMember.objects.create(channel=channel, user=user_to_add, role_in_channel=ChannelMemberRole.MEMBER)
            except CustomUser.DoesNotExist:
                pass # Ignore if a member_id is invalid or handle error
        return channel