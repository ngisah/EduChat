"""
Django settings for educhat_project project.
"""
import os
from dotenv import load_dotenv # For loading .env files
from pathlib import Path # For path manipulation

# Base directory of the Django project.
BASE_DIR = Path(__file__).resolve().parent.parent



# Security settings
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key-for-dev') # IMPORTANT: Use a strong, unique key in production
DEBUG = os.getenv('DEBUG', 'False') == 'True' # Controls debug mode (should be False in production)

ALLOWED_HOSTS_str = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_str.split(',')] # List of allowed hostnames

# Application definition
INSTALLED_APPS = [
    'daphne', # ASGI server, must be first for Channels
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework', # Django REST Framework for APIs
    'rest_framework_simplejwt', # For JWT authentication
    'channels', # Django Channels for WebSocket support
    'corsheaders', # For Cross-Origin Resource Sharing (CORS)

    'users.apps.UsersConfig', # Custom users app
    'chat.apps.ChatConfig',   # Chat application
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # For serving static files efficiently in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Handles CORS headers, must be placed before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware', # CSRF protection
    'django.contrib.auth.middleware.AuthenticationMiddleware', # Adds 'user' object to request
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware', # Protects against clickjacking
]

ROOT_URLCONF = 'educhat_be.urls' # Main URL configuration file

TEMPLATES = [ 
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], # Project-level template directory
        'APP_DIRS': True, # Allows Django to find templates within app directories
        'OPTIONS': {
            'context_processors': [ # Default context processors
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI and ASGI application paths
WSGI_APPLICATION = 'educhat_be.wsgi.application' # For synchronous HTTP requests (traditional Django)
ASGI_APPLICATION = 'educhat_be.asgi.application' # For asynchronous requests (Channels, WebSockets) SDD 2.2

# Database configuration (PostgreSQL). SDD 2.3, 3.4
# Uses dj_database_url to parse DATABASE_URL from .env. Defaults to SQLite for local dev if not set.
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}", conn_max_age=600)
}

# Password validation settings. SDD NFR-SEC-003
AUTH_PASSWORD_VALIDATORS = [ 
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': { 'min_length': 8 } },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC' # Store datetimes in UTC in the database. SDD 4.1
USE_I18N = True # Enable internationalization
USE_TZ = True # Enable timezone support

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/' # URL prefix for static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles_build', 'static') # Directory where collectstatic will gather static files for production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage' # Efficient static file serving with WhiteNoise

# Media files (User-uploaded content like profile pictures)
MEDIA_URL = '/media/' # URL prefix for media files
MEDIA_ROOT = os.path.join(BASE_DIR, 'media') # Directory where media files will be stored

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField' # Default primary key type

AUTH_USER_MODEL = 'users.CustomUser' # Specifies the custom user model. SDD 4.1

# Django REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication', # Use JWT for API authentication
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', # Default: endpoints require authentication
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination', # Default pagination style
    'PAGE_SIZE': 20 # Number of items per page for paginated responses
}

# Django Simple JWT settings (for JWT token behavior)
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60), # Access token validity period
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),    # Refresh token validity period
    'ROTATE_REFRESH_TOKENS': True, # Issue a new refresh token when an old one is used
    'BLACKLIST_AFTER_ROTATION': True, # Add the old refresh token to a blacklist after rotation
    'ALGORITHM': 'HS256', # Signing algorithm
    'SIGNING_KEY': SECRET_KEY, # Use Django's SECRET_KEY for signing JWTs
    'USER_ID_FIELD': 'user_id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_HEADER_TYPES': ('Bearer',), # Expected format for Authorization header: "Bearer <token>"
}

# Channels Layer configuration (using Redis). SDD 3.5
# This layer allows communication between different instances of the application, essential for WebSocket scaling.
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/1') # Get Redis URL from .env
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer", # Use Redis as the backend
        "CONFIG": {
            "hosts": [REDIS_URL], # List of Redis server addresses
        },
    },
}

# CORS (Cross-Origin Resource Sharing) settings. SDD Security
# Allows the React frontend (running on a different port/domain) to make requests to this backend.
CORS_ALLOWED_ORIGINS_str = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_str.split(',')]
CORS_ALLOW_CREDENTIALS = True # Allow cookies to be sent with cross-origin requests (if needed)

# Email Backend configuration (for password reset, etc.). SDD 3.6
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend' # Development: prints emails to console
# For production, configure an actual SMTP server:
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = os.getenv('EMAIL_HOST')
# ... (other SMTP settings) ...

# Logging configuration. SDD 10.2
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False, # Do not disable Django's default loggers
    'handlers': {
        'console': { # Handler to output logs to the console
            'class': 'logging.StreamHandler',
        },
    },
    'root': { # Root logger configuration
        'handlers': ['console'],
        'level': 'INFO', # Default logging level (INFO, DEBUG, WARNING, ERROR, CRITICAL)
    },
    'loggers': { # Configuration for specific loggers
        'django': { # Django's own logger
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'), # Configurable via .env
            'propagate': False, # Do not pass messages to parent loggers
        },
        'channels': { # Logger for Django Channels
            'handlers': ['console'],
            'level': 'DEBUG', # More verbose logging for Channels during development
            'propagate': False,
        },
    },
}

