from rest_framework import generics, status, permissions # DRF generic views, status codes, permission classes
from rest_framework.response import Response # DRF Response object for API responses
from rest_framework_simplejwt.tokens import RefreshToken # For generating JWT tokens upon login/registration

from .serializers import UserRegistrationSerializer, UserSerializer # Import serializers defined above
from .models import CustomUser # Import the CustomUser model

# API view for user registration. Inherits from CreateAPIView for handling POST requests to create new users.
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer # Specifies the serializer to use for this view
    permission_classes = [permissions.AllowAny] # Allows any user (even unauthenticated) to access this endpoint for registration

    # Overrides the default create method to include JWT tokens in the registration response.
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) # Validates incoming data, raises exception if invalid
        user = serializer.save() # Saves the new user instance
        refresh = RefreshToken.for_user(user) # Generates JWT refresh and access tokens for the new user
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data, # Serialized user data
            "refresh": str(refresh), # Refresh token
            "access": str(refresh.access_token), # Access token
            "message": "User registered successfully."
        }, status=status.HTTP_201_CREATED) # HTTP 201 Created status

# API view for retrieving and updating the authenticated user's details.
class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer # Uses UserSerializer for user data
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can access this

    # Returns the currently authenticated user object.
    def get_object(self):
        return self.request.user # Ensures users can only access/update their own profile

# API view for listing/searching users (e.g., to start a new chat). SDD 9.1
class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Defines the queryset for listing users. Filters based on a 'search' query parameter.
    def get_queryset(self):
        queryset = CustomUser.objects.all()
        search_query = self.request.query_params.get('search', None) # Get 'search' from URL query params
        if search_query:
            # Filters by full_name or email containing the search query (case-insensitive).
            queryset = queryset.filter(full_name__icontains=search_query) | \
                       queryset.filter(email__icontains=search_query)
        return queryset.exclude(user_id=self.request.user.user_id) # Excludes the requesting user from search results
