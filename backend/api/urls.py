from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, UserProfileView, UserSearchView, WorkspaceViewSet,
    ChannelViewSet, MessageViewSet, ConversationViewSet, ProjectViewSet,
    TaskViewSet, PollViewSet, IdeaViewSet, ActivityEventViewSet,
    NotificationViewSet, GlobalSearchView
)

router = DefaultRouter()
router.register(r'workspaces', WorkspaceViewSet, basename='workspace')
router.register(r'channels', ChannelViewSet, basename='channel')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'polls', PollViewSet, basename='poll')
router.register(r'ideas', IdeaViewSet, basename='idea')
router.register(r'activities', ActivityEventViewSet, basename='activity')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='auth_profile'),
    path('auth/users/search/', UserSearchView.as_view(), name='user_search'),

    # Search
    path('search/', GlobalSearchView.as_view(), name='global_search'),

    # Router API
    path('', include(router.urls)),
]
