from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import (
    User, Workspace, WorkspaceMember, Channel, Conversation, ConversationMember,
    Message, Reaction, Project, Task, TaskComment, Poll, PollOption, PollVote,
    Idea, ActivityEvent, Notification
)
from .serializers import (
    UserProfileSerializer, RegisterSerializer, WorkspaceSerializer, WorkspaceMemberSerializer,
    ChannelSerializer, MessageSerializer, ReactionSerializer, ProjectSerializer,
    TaskSerializer, TaskCommentSerializer, ConvertMessageToTaskSerializer,
    ConversationSerializer, PollSerializer, IdeaSerializer, ActivityEventSerializer,
    NotificationSerializer
)
from .permissions import IsWorkspaceMember, IsWorkspaceAdminOrOwner


def broadcast_to_workspace(workspace_id, event_type, data):
    """Broadcast an event to all subscribers in the workspace channel layer."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"workspace_{workspace_id}",
                {
                    "type": "workspace_event",
                    "event_type": event_type,
                    "payload": data
                }
            )
    except Exception as e:
        # Avoid crashing API request if WebSocket layer is temporarily unavailable
        print(f"Broadcast error: {e}")


def log_activity(workspace, actor, event_type, target_type, target_id, description):
    """Log an activity event and broadcast it in real time."""
    event = ActivityEvent.objects.create(
        workspace=workspace,
        actor=actor,
        event_type=event_type,
        target_type=target_type,
        target_id=target_id,
        description=description
    )
    broadcast_to_workspace(
        workspace.id,
        "activity_created",
        ActivityEventSerializer(event).data
    )
    return event


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserSearchView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', '').strip()
        if not query:
            return User.objects.none()
        return User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query) | Q(first_name__icontains=query)
        ).exclude(id=self.request.user.id)[:10]


class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Workspaces where user is a member
        return Workspace.objects.filter(memberships__user=self.request.user).distinct()

    def perform_create(self, serializer):
        workspace = serializer.save(owner=self.request.user)
        # Create Owner membership
        WorkspaceMember.objects.create(
            workspace=workspace,
            user=self.request.user,
            role='owner'
        )
        # Create default 'general' and 'random' channels
        Channel.objects.create(
            workspace=workspace,
            name='general',
            description='General discussions for everyone',
            created_by=self.request.user
        )
        Channel.objects.create(
            workspace=workspace,
            name='random',
            description='Watercooler chats and fun ideas',
            created_by=self.request.user
        )
        log_activity(workspace, self.request.user, 'workspace_created', 'workspace', workspace.id, f"Created workspace {workspace.name}")

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        workspace = self.get_object()
        members = workspace.memberships.select_related('user').all()
        serializer = WorkspaceMemberSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def invite_member(self, request, pk=None):
        workspace = self.get_object()
        # Verify permissions: only admin or owner can invite
        my_membership = workspace.memberships.filter(user=request.user).first()
        if not my_membership or my_membership.role not in ['owner', 'admin']:
            return Response({'error': 'Only workspace admins or owners can invite members'}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        member, created = WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            user=target_user,
            defaults={'role': role}
        )
        if not created:
            return Response({'message': 'User is already a member of this workspace'}, status=status.HTTP_200_OK)

        log_activity(workspace, request.user, 'member_joined', 'user', target_user.id, f"Invited {target_user.username} as {role}")
        Notification.objects.create(
            user=target_user,
            actor=request.user,
            workspace=workspace,
            type='workspace_invite',
            title='Workspace Invitation',
            message=f"{request.user.username} invited you to {workspace.name}",
            reference_type='workspace',
            reference_id=workspace.id
        )

        return Response(WorkspaceMemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_member_role(self, request, pk=None):
        workspace = self.get_object()
        my_membership = workspace.memberships.filter(user=request.user).first()
        if not my_membership or my_membership.role != 'owner':
            return Response({'error': 'Only the workspace owner can change member roles'}, status=status.HTTP_403_FORBIDDEN)

        member_id = request.data.get('member_id')
        new_role = request.data.get('role')
        if new_role not in ['admin', 'member', 'guest']:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member = workspace.memberships.get(id=member_id)
            if member.role == 'owner':
                return Response({'error': 'Cannot change role of workspace owner'}, status=status.HTTP_400_BAD_REQUEST)
            member.role = new_role
            member.save()
            return Response(WorkspaceMemberSerializer(member).data)
        except WorkspaceMember.DoesNotExist:
            return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)


class ChannelViewSet(viewsets.ModelViewSet):
    serializer_class = ChannelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace_id')
        if workspace_id:
            return Channel.objects.filter(
                workspace_id=workspace_id,
                workspace__memberships__user=self.request.user
            ).distinct()
        if self.detail:
            return Channel.objects.filter(
                workspace__memberships__user=self.request.user
            ).distinct()
        return Channel.objects.none()

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = Workspace.objects.get(id=workspace_id, memberships__user=self.request.user)
        channel = serializer.save(workspace=workspace, created_by=self.request.user)
        log_activity(workspace, self.request.user, 'channel_created', 'channel', channel.id, f"Created #{channel.name}")
        broadcast_to_workspace(workspace.id, 'channel_created', ChannelSerializer(channel).data)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        channel_id = self.request.query_params.get('channel_id')
        conversation_id = self.request.query_params.get('conversation_id')
        workspace_id = self.request.query_params.get('workspace_id')

        qs = Message.objects.select_related('sender', 'reply_to', 'reply_to__sender').prefetch_related(
            'reactions', 'reactions__user', 'converted_tasks'
        )

        if channel_id:
            return qs.filter(channel_id=channel_id, channel__workspace__memberships__user=self.request.user)
        if conversation_id:
            return qs.filter(conversation_id=conversation_id, conversation__members__user=self.request.user)
        if workspace_id:
            return qs.filter(workspace_id=workspace_id, workspace__memberships__user=self.request.user)
        if self.detail:
            return qs.filter(workspace__memberships__user=self.request.user)
        return Message.objects.none()

    def perform_create(self, serializer):
        channel_id = self.request.data.get('channel')
        conversation_id = self.request.data.get('conversation')
        workspace_id = self.request.data.get('workspace')

        workspace = None
        channel = None
        conversation = None

        if channel_id:
            channel = Channel.objects.get(id=channel_id, workspace__memberships__user=self.request.user)
            workspace = channel.workspace
        elif conversation_id:
            conversation = Conversation.objects.get(id=conversation_id, members__user=self.request.user)
            workspace = conversation.workspace
        elif workspace_id:
            workspace = Workspace.objects.get(id=workspace_id, memberships__user=self.request.user)

        message = serializer.save(sender=self.request.user, workspace=workspace, channel=channel, conversation=conversation)
        
        # Broadcast real-time message event
        data = MessageSerializer(message).data
        if workspace:
            broadcast_to_workspace(workspace.id, 'new_message', data)

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        message = self.get_object()
        emoji = request.data.get('emoji')
        if not emoji:
            return Response({'error': 'Emoji is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Toggle reaction
        existing = Reaction.objects.filter(message=message, user=request.user, emoji=emoji).first()
        if existing:
            existing.delete()
            action_type = 'reaction_removed'
        else:
            Reaction.objects.create(message=message, user=request.user, emoji=emoji)
            action_type = 'reaction_added'

        data = MessageSerializer(message).data
        if message.workspace:
            broadcast_to_workspace(message.workspace.id, action_type, data)
        return Response(data)

    # SIGNATURE FEATURE: CONVERSATION-TO-ACTION (Convert message to task)
    @action(detail=True, methods=['post'])
    def convert_to_task(self, request, pk=None):
        message = self.get_object()
        serializer = ConvertMessageToTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id = serializer.validated_data['project_id']
        try:
            project = Project.objects.get(
                id=project_id,
                workspace=message.workspace,
                workspace__memberships__user=request.user
            )
        except Project.DoesNotExist:
            return Response({'error': 'Target project does not exist in this workspace'}, status=status.HTTP_404_NOT_FOUND)

        assignee = None
        assignee_id = serializer.validated_data.get('assignee_id')
        if assignee_id:
            assignee = User.objects.filter(id=assignee_id).first()

        # Create Task linked to source message
        task = Task.objects.create(
            project=project,
            title=serializer.validated_data['title'],
            description=serializer.validated_data.get('description', '') or message.content,
            priority=serializer.validated_data['priority'],
            status=serializer.validated_data['status'],
            assignee=assignee,
            due_date=serializer.validated_data.get('due_date'),
            source_message=message,
            created_by=request.user
        )

        # Mark source message as converted
        message.is_converted_to_task = True
        message.save(update_fields=['is_converted_to_task'])

        # Notify assignee if assigned
        if assignee and assignee != request.user:
            Notification.objects.create(
                user=assignee,
                actor=request.user,
                workspace=message.workspace,
                type='task_assigned',
                title='New Task Assigned',
                message=f"{request.user.username} converted a message into task '{task.title}' and assigned it to you.",
                reference_type='task',
                reference_id=task.id
            )

        # Log activity
        log_activity(
            message.workspace,
            request.user,
            'message_converted',
            'task',
            task.id,
            f"Converted message into task: '{task.title}' in project {project.name}"
        )

        # Broadcast both message update and task created
        broadcast_to_workspace(message.workspace.id, 'task_created', TaskSerializer(task).data)
        broadcast_to_workspace(message.workspace.id, 'message_updated', MessageSerializer(message).data)

        return Response({
            'message': 'Message converted to task successfully',
            'task': TaskSerializer(task).data,
            'source_message': MessageSerializer(message).data
        }, status=status.HTTP_201_CREATED)


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace_id')
        if workspace_id:
            return Project.objects.filter(
                workspace_id=workspace_id,
                workspace__memberships__user=self.request.user
            ).distinct()
        if self.detail:
            return Project.objects.filter(
                workspace__memberships__user=self.request.user
            ).distinct()
        return Project.objects.none()

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = Workspace.objects.get(id=workspace_id, memberships__user=self.request.user)
        project = serializer.save(workspace=workspace, created_by=self.request.user)
        log_activity(workspace, self.request.user, 'project_created', 'project', project.id, f"Created project {project.name}")
        broadcast_to_workspace(workspace.id, 'project_created', ProjectSerializer(project).data)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        workspace_id = self.request.query_params.get('workspace_id')

        qs = Task.objects.select_related('project', 'assignee', 'created_by', 'source_message', 'source_message__sender')

        if project_id:
            return qs.filter(project_id=project_id, project__workspace__memberships__user=self.request.user)
        if workspace_id:
            return qs.filter(project__workspace_id=workspace_id, project__workspace__memberships__user=self.request.user)
        if self.detail:
            return qs.filter(project__workspace__memberships__user=self.request.user)
        return Task.objects.none()

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        workspace = task.project.workspace
        log_activity(workspace, self.request.user, 'task_created', 'task', task.id, f"Created task '{task.title}'")
        broadcast_to_workspace(workspace.id, 'task_created', TaskSerializer(task).data)

        if task.assignee and task.assignee != self.request.user:
            Notification.objects.create(
                user=task.assignee,
                actor=self.request.user,
                workspace=workspace,
                type='task_assigned',
                title='Task Assigned',
                message=f"{self.request.user.username} assigned task '{task.title}' to you.",
                reference_type='task',
                reference_id=task.id
            )

    def perform_update(self, serializer):
        old_status = self.get_object().status
        task = serializer.save()
        workspace = task.project.workspace

        if old_status != task.status and task.status == 'done':
            log_activity(workspace, self.request.user, 'task_completed', 'task', task.id, f"Completed task '{task.title}' 🎉")
        else:
            log_activity(workspace, self.request.user, 'task_updated', 'task', task.id, f"Updated task '{task.title}' to {task.status}")

        broadcast_to_workspace(workspace.id, 'task_updated', TaskSerializer(task).data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        if new_status not in [c[0] for c in Task.STATUS_CHOICES]:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        task.status = new_status
        task.save(update_fields=['status', 'updated_at'])
        workspace = task.project.workspace

        if new_status == 'done':
            log_activity(workspace, request.user, 'task_completed', 'task', task.id, f"Completed task '{task.title}' 🎉")
        else:
            log_activity(workspace, request.user, 'task_status_changed', 'task', task.id, f"Moved '{task.title}' to {new_status}")

        data = TaskSerializer(task).data
        broadcast_to_workspace(workspace.id, 'task_updated', data)
        return Response(data)

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            comments = task.comments.select_related('user').all()
            return Response(TaskCommentSerializer(comments, many=True).data)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)

        comment = TaskComment.objects.create(task=task, user=request.user, content=content)
        return Response(TaskCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(members__user=self.request.user).distinct()

    def create(self, request, *args, **kwargs):
        target_user_id = request.data.get('user_id')
        workspace_id = request.data.get('workspace_id')
        if not target_user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check existing 1-on-1 direct conversation
        existing = Conversation.objects.filter(
            type='direct',
            members__user=request.user
        ).filter(members__user=target_user).first()

        if existing:
            return Response(ConversationSerializer(existing).data)

        workspace = Workspace.objects.filter(id=workspace_id).first() if workspace_id else None
        conversation = Conversation.objects.create(type='direct', workspace=workspace)
        ConversationMember.objects.create(conversation=conversation, user=request.user)
        ConversationMember.objects.create(conversation=conversation, user=target_user)

        return Response(ConversationSerializer(conversation).data, status=status.HTTP_201_CREATED)


class PollViewSet(viewsets.ModelViewSet):
    serializer_class = PollSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace_id')
        if workspace_id:
            return Poll.objects.filter(workspace_id=workspace_id, workspace__memberships__user=self.request.user)
        if self.detail:
            return Poll.objects.filter(workspace__memberships__user=self.request.user)
        return Poll.objects.none()

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = Workspace.objects.get(id=workspace_id, memberships__user=self.request.user)
        poll = serializer.save(workspace=workspace, created_by=self.request.user)

        options = self.request.data.get('options', [])
        for opt in options:
            if isinstance(opt, str) and opt.strip():
                PollOption.objects.create(poll=poll, label=opt.strip())

        log_activity(workspace, self.request.user, 'poll_created', 'poll', poll.id, f"Created poll: {poll.question}")
        broadcast_to_workspace(workspace.id, 'poll_created', PollSerializer(poll, context={'request': self.request}).data)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        poll = self.get_object()
        option_id = request.data.get('option_id')
        try:
            option = poll.options.get(id=option_id)
        except PollOption.DoesNotExist:
            return Response({'error': 'Option not found'}, status=status.HTTP_404_NOT_FOUND)

        # Single choice vote toggle/update
        PollVote.objects.filter(option__poll=poll, user=request.user).delete()
        PollVote.objects.create(option=option, user=request.user)

        data = PollSerializer(poll, context={'request': request}).data
        broadcast_to_workspace(poll.workspace.id, 'poll_updated', data)
        return Response(data)


class IdeaViewSet(viewsets.ModelViewSet):
    serializer_class = IdeaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace_id')
        if workspace_id:
            return Idea.objects.filter(workspace_id=workspace_id, workspace__memberships__user=self.request.user)
        if self.detail:
            return Idea.objects.filter(workspace__memberships__user=self.request.user)
        return Idea.objects.none()

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = Workspace.objects.get(id=workspace_id, memberships__user=self.request.user)
        idea = serializer.save(workspace=workspace, created_by=self.request.user)
        log_activity(workspace, self.request.user, 'idea_created', 'idea', idea.id, f"Shared idea: '{idea.title}'")
        broadcast_to_workspace(workspace.id, 'idea_created', IdeaSerializer(idea, context={'request': self.request}).data)

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        idea = self.get_object()
        if idea.upvotes.filter(id=request.user.id).exists():
            idea.upvotes.remove(request.user)
        else:
            idea.upvotes.add(request.user)

        data = IdeaSerializer(idea, context={'request': request}).data
        broadcast_to_workspace(idea.workspace.id, 'idea_updated', data)
        return Response(data)


class ActivityEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace_id')
        if not workspace_id:
            return ActivityEvent.objects.none()
        return ActivityEvent.objects.filter(
            workspace_id=workspace_id,
            workspace__memberships__user=self.request.user
        ).select_related('actor')[:50]


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).select_related('actor', 'workspace')[:30]

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})


class GlobalSearchView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        workspace_id = request.query_params.get('workspace_id')
        if not query or not workspace_id:
            return Response({'channels': [], 'messages': [], 'tasks': [], 'ideas': []})

        # Verify membership
        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists():
            return Response({'error': 'Unauthorized workspace access'}, status=status.HTTP_403_FORBIDDEN)

        channels = Channel.objects.filter(workspace_id=workspace_id, name__icontains=query)[:5]
        messages = Message.objects.filter(workspace_id=workspace_id, content__icontains=query).select_related('sender', 'channel')[:10]
        tasks = Task.objects.filter(project__workspace_id=workspace_id, title__icontains=query).select_related('project', 'assignee')[:10]
        ideas = Idea.objects.filter(workspace_id=workspace_id, title__icontains=query)[:5]

        return Response({
            'channels': ChannelSerializer(channels, many=True).data,
            'messages': MessageSerializer(messages, many=True).data,
            'tasks': TaskSerializer(tasks, many=True).data,
            'ideas': IdeaSerializer(ideas, many=True).data,
        })
