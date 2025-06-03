# Custom permission classes for fine-grained access control in API views.
from rest_framework import permissions
from .models import ChannelMember, ChannelMemberRole # Import models needed for permission checks

# Permission to allow access only if the user is a member or admin of the specific channel object.
class IsChannelMemberOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj): # obj is the Channel instance
        if request.user.is_staff: # Django staff users have all permissions
            return True
        # Check if a ChannelMember record exists for this user and channel.
        return ChannelMember.objects.filter(channel=obj, user=request.user).exists()

# Permission to allow access only if the user is an admin of the specific channel object.
class IsChannelAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj): # obj is the Channel instance
        if request.user.is_staff:
            return True
        try:
            member = ChannelMember.objects.get(channel=obj, user=request.user)
            return member.role_in_channel == ChannelMemberRole.ADMIN # Check if role is ADMIN
        except ChannelMember.DoesNotExist:
            return False # User is not a member, so definitely not an admin

# Permission to allow access only if user is the sender of the message or an admin of the message's channel.
class IsSenderOrChannelAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj): # obj is the Message instance
        if request.user.is_staff:
            return True
        is_sender = obj.sender == request.user # Check if user is the message sender
        try:
            member = ChannelMember.objects.get(channel=obj.channel, user=request.user)
            is_admin = member.role_in_channel == ChannelMemberRole.ADMIN # Check if user is admin of the channel
            return is_sender or is_admin # Allow if either condition is true
        except ChannelMember.DoesNotExist:
            return False # User is not even a member of the channel
