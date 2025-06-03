# This file defines database models for chat-related functionalities like channels, members, and messages.

from django.conf import settings # To get AUTH_USER_MODEL from project settings
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid # For unique IDs

# Defines the roles a user can have within the application.
class UserRole(models.TextChoices):
    STUDENT = 'student', 'Student'
    EDUCATOR = 'educator', 'Educator'

# Custom User model extending Django's AbstractUser.
# This allows adding custom fields like user_id, full_name, profile_picture_url, and role.
class CustomUser(AbstractUser):
    # --- Start of Class Block: All lines below must be indented ---

    # This is one level of indentation (usually 4 spaces)
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # This field must have the same indentation
    full_name = models.CharField(max_length=255, blank=True)
    
    # This field must have the same indentation
    profile_picture_url = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    
    # This field must have the same indentation
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
    )

    # This field must also have the same indentation
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="customuser_set",
        related_query_name="user",
    )
    
    # This field must also have the same indentation
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="customuser_set",
        related_query_name="user",
    )

    
    # Overriding the save method to automatically populate full_name if first_name or last_name exists.
    def save(self, *args, **kwargs):
        if not self.full_name and (self.first_name or self.last_name):
            self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    # String representation of the User model, typically used in Django admin.
    def __str__(self):
        return self.email if self.email else str(self.user_id)


