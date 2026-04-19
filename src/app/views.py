from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.middleware.csrf import get_token


# DRF
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, generics, permissions
from .models import SWOTAnalysis, CrossSWOT, Project, ChatRoom, ChatMessage

# Serializerの読み込み
from .serializers import (SWOTAnalysisSerializer, 
                          CrossSWOTSerializer, 
                          UserRegistrationSerializer,
                          ProjectSerializer,
                          UserSerializer,
                          ChatMessageSerializer,
                          )

import logging

logger = logging.getLogger(__name__)

@ensure_csrf_cookie
def csrf_token_view(request):
    # get_token関数でCSRFトークンを取得
    csrf_token = get_token(request)
    return JsonResponse({
        'detail': 'CSRF cookie has been set',
        'csrfToken': csrf_token,
    })
User = get_user_model()

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email
        })

class UserRegistrationView(APIView):
    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'ユーザ登録が成功しました'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    def post(self, request, format=None):

        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            # セッション認証の場合は login() を呼ぶ
            login(request, user)
            # またはトークン認証の場合はトークン発行処理を行います
            return Response({'message': 'ログイン成功'}, status=status.HTTP_200_OK)
        return Response({'error': '認証に失敗しました'}, status=status.HTTP_400_BAD_REQUEST)

class UserLogoutView(APIView):
    def post(self, request, format=None):
        logout(request)  # セッションを破棄する
        return Response({'message': 'ログアウトしました'}, status=status.HTTP_200_OK)
    
class SWOTAnalysisViewSet(viewsets.ModelViewSet):
    serializer_class = SWOTAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        current_user = self.request.user
        print("get_queryset: current_user", current_user)
        # 現在のユーザーが作成したSWOT分析のみを返す
        return SWOTAnalysis.objects.filter(user=current_user)

    def perform_create(self, serializer):
        # 現在のユーザーを分析に紐づける
        serializer.save(user=self.request.user)

class PersonalSWOTAnalysisViewSet(viewsets.ModelViewSet):
    serializer_class = SWOTAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SWOTAnalysis.objects.filter(
            user=self.request.user,
            project__isnull=True
        )

    def perform_create(self, serializer):
        # 個人用の場合は project=None として保存
        serializer.save(user=self.request.user, project=None)


class ProjectSWOTAnalysisViewSet(viewsets.ModelViewSet):
    serializer_class = SWOTAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return SWOTAnalysis.objects.filter(project_id=project_id)
    
    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)
        serializer.save(user=self.request.user, project=project)


class CrossSWOTViewSet(viewsets.ModelViewSet):
    serializer_class = CrossSWOTSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CrossSWOT.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        logger.debug(f"Request User: {user} (ID: {user.id})")
        return Project.objects.filter(
            Q(user=user) | Q(members=user)
        ).distinct()
    
    @action(detail=True, methods=['post'], url_path='invite-member')
    def invite_member(self, request, pk=None):
        project = self.get_object()

        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
        project.members.add(user)
        return Response({"detail": f"User {user.username} added to project."}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_messages(request, room_id):
    """
    指定した room_id (ここでは ChatRoom の id を想定) に属するチャットメッセージを返す
    """
    try:
        room = ChatRoom.objects.get(id=room_id)
    except ChatRoom.DoesNotExist:
        return Response({"detail": "Chat room not found."}, status=status.HTTP_404_NOT_FOUND)

    # メッセージをタイムスタンプ順に取得（古い順に並べる）
    messages = ChatMessage.objects.filter(room=room).order_by("timestamp")
    serializer = ChatMessageSerializer(messages, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
