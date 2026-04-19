"""src URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from app.views import (
    CurrentUserView, 
    UserLogoutView, 
    UserRegistrationView, 
    UserLoginView, 
    SWOTAnalysisViewSet, 
    CrossSWOTViewSet,
    csrf_token_view,
    ProjectViewSet,
    UserListView,
    get_chat_messages,
    PersonalSWOTAnalysisViewSet,
    ProjectSWOTAnalysisViewSet,
)

# DRFのDefaultRouterを利用してSWOTAnalysisViewSetのエンドポイントを自動生成
router = DefaultRouter()
router.register(r'swot-analysis', SWOTAnalysisViewSet, basename='swot-analysis')
router.register(r'cross-swot', CrossSWOTViewSet, basename='cross-swot')
router.register(r'projects', ProjectViewSet, basename='projects')

urlpatterns = [
    path('admin/', admin.site.urls),
    # APIエンドポイントは/api/以下で提供する
    path('api/auth/register/', UserRegistrationView.as_view(), name='api_register'),
    path('api/auth/login/', UserLoginView.as_view(), name='api_login'),
    path('api/auth/logout/', UserLogoutView.as_view(), name='api_logout'),
    path('api/csrf/', csrf_token_view, name='csrf'),
    path('api/current-user/', CurrentUserView.as_view(), name='current-user'),
    path('api/users/', UserListView.as_view(), name='user-list'),
    path('api/chat/<str:room_id>/messages/', get_chat_messages, name='chat-messages'),
    # 個人用 SWOT 分析のエンドポイント
    path('api/personal-swot/', PersonalSWOTAnalysisViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='personal-swot-list'),
    path('api/personal-swot/<int:pk>/', PersonalSWOTAnalysisViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name='personal-swot-detail'),
    
    # プロジェクト用 SWOT 分析のエンドポイント
    path('api/projects/<int:project_id>/swot/', ProjectSWOTAnalysisViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='project-swot-list'),
    path('api/projects/<int:project_id>/swot/<int:pk>/', ProjectSWOTAnalysisViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name='project-swot-detail'),
    # DRFのルーターで生成されたAPIエンドポイントを/api/以下に統合
    path('api/', include(router.urls)),
]


