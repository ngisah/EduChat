# This file defines database models for chat-related functionalities like channels, members, and messages.

from django.conf import settings # To get AUTH_USER_MODEL from project settings
from django.db import models
import uuid # For unique IDs

# Model representing a chat channel (can be a group chat or a direct message).
class Channel(models.Model):
    channel_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) # Unique ID for the channel
    name = models.CharField(max_length=255) # Name of the channel
    description = models.TextField(blank=True, null=True) # Optional description
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='created_channels', # Allows accessing channels created by a user via user.created_channels
        on_delete=models.CASCADE # If creator is deleted, their channels are also deleted
    )
    is_private_chat = models.BooleanField(default=False) # Flag to distinguish DMs from group channels
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        through='ChannelMember', # Specifies the intermediate model for the many-to-many relationship
        related_name='chat_channels' # Allows accessing channels a user is part of via user.chat_channels
    )
    created_at = models.DateTimeField(auto_now_add=True) # Timestamp for channel creation
    updated_at = models.DateTimeField(auto_now=True) # Timestamp for last update

    def __str__(self):
        return self.name

# Defines roles within a specific channel (e.g., member or admin of a group).
class ChannelMemberRole(models.TextChoices):
    MEMBER = 'member', 'Member'
    ADMIN = 'admin', 'Admin' 

# Intermediate model linking Users to Channels, defining their membership and role within that channel.
class ChannelMember(models.Model):
    channel_member_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE) # Link to the Channel
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE) # Link to the User
    role_in_channel = models.CharField(
        max_length=10, 
        choices=ChannelMemberRole.choices, 
        default=ChannelMemberRole.MEMBER # Default role is member
    )
    joined_at = models.DateTimeField(auto_now_add=True) # Timestamp when user joined the channel

    class Meta:
        unique_together = ('channel', 'user') # Ensures a user can only be in a channel once

    def __str__(self):
        return f"{self.user.email} in {self.channel.name}"

# Model representing a single message sent within a channel.
class Message(models.Model):
    message_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) # Unique ID for the message
    channel = models.ForeignKey(Channel, related_name='messages', on_delete=models.CASCADE) # Channel this message belongs to
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE) # User who sent the message
    content = models.TextField() # The actual text content of the message
    sent_at = models.DateTimeField(auto_now_add=True) # Timestamp when message was sent
    updated_at = models.DateTimeField(auto_now=True) # Timestamp for last update (for future edit feature)

    class Meta:
        ordering = ['sent_at'] # Default ordering for messages by time sent

    def __str__(self):
        return f"Message from {self.sender.email} in {self.channel.name} at {self.sent_at}"

# Model to store user presence status (online, offline, away).
# Can also be managed in a caching system like Redis for better performance in a high-traffic app.
class UserPresence(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, primary_key=True, on_delete=models.CASCADE) # One-to-one link with User
    status = models.CharField(max_length=10, default='offline') # e.g., 'online', 'offline', 'away'
    last_seen_at = models.DateTimeField(auto_now=True) # Timestamp of last activity or status change

    def __str__(self):
        return f"{self.user.email} is {self.status}"
