import os
from pathlib import Path
from decouple import config  # python-decouple を利用
import dj_database_url
import ssl
from urllib.parse import urlparse
import redis

# プロジェクトのルートディレクトリを定義
BASE_DIR = Path(__file__).resolve().parent.parent

# セキュリティ設定
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0').split(',')

# アプリケーション定義
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'app',               # あなたのアプリ
    'channels',          # Django Channels
    'corsheaders',
    'rest_framework',
    'django_extensions',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myproject.urls'  # プロジェクトの URL 設定
WSGI_APPLICATION = 'myproject.wsgi.application'
ASGI_APPLICATION = 'myproject.asgi.application'

# Redis 接続設定（Heroku Key-Value Store 用）
redis_url = config("REDIS_URL")

if not redis_url:
    raise ValueError("REDIS_URL is not set in the environment.")

parsed_url = urlparse(redis_url)
# Redis クライアントのテスト（接続確認用）
r = redis.Redis(
    host=parsed_url.hostname,
    port=parsed_url.port,
    password=parsed_url.password,
    ssl=(parsed_url.scheme == "rediss"),
    ssl_cert_reqs=ssl.CERT_NONE if parsed_url.scheme == "rediss" else None,
)
try:
    if r.ping():
        print("Successfully connected to Heroku Key-Value Store (Redis).")
except Exception as e:
    print("Error connecting to Redis:", e)

# Django Channels 用の CHANNEL_LAYERS 設定
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [{
                'address': redis_url,
                'ssl': True if redis_url.startswith("rediss://") else False,
                'ssl_cert_reqs': ssl.CERT_NONE if redis_url.startswith("rediss://") else None,
            }],
        },
    },
}

# テンプレート設定
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'src/templates'],  # テンプレートディレクトリ
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# データベース設定
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///db.sqlite3')
    )
}

# パスワードバリデーション
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# 国際化
LANGUAGE_CODE = config('LANGUAGE_CODE', default='en-us')
TIME_ZONE = config('TIME_ZONE', default='UTC')
USE_I18N = True
USE_L10N = True
USE_TZ = True

# 静的ファイル設定
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 認証関連の設定
LOGIN_REDIRECT_URL = '/profile/'
LOGOUT_REDIRECT_URL = '/'

# Django REST Framework の設定
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
}

# CORS 設定
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:8001',
    'https://t-mng-f8f2dda9840d.herokuapp.com',
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://t-.*-oikotas-projects\.vercel\.app$"
]
CORS_ALLOW_CREDENTIALS = True

# CSRF 設定
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:8001',
    'https://*.vercel.app',
]
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SAMESITE = 'None'

# ログ設定（Heroku の標準出力へ出力）
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'formatters': {
        'simple': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        },
    },
    'loggers': {
        'app': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
