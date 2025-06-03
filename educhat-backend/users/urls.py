from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView # JWT views for login and token refresh
from .views import UserRegistrationView, UserDetailView, UserListView

app_name = 'users' # Namespace for these URLs

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'), # URL for user registration
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # URL for JWT login (obtains token pair)
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # URL to refresh JWT access token
    path('me/', UserDetailView.as_view(), name='user_detail'), # URL for current user's details (GET, PUT, PATCH)
    path('', UserListView.as_view(), name='user_list_search'), # URL for listing/searching users
]