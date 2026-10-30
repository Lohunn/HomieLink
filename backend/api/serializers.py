from rest_framework import serializers
from .models import (
    User, Workspace, WorkspaceMember, Channel, Conversation, ConversationMember,
    Message, Reaction, Project, Task, TaskComment, Poll, PollOption, PollVote,
    Idea, ActivityEvent, Notification
)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'bio', 'avatar_url', 'first_name', 'last_name', 'created_at')
        read_only_fields = ('id', 'created_at')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )

    class Meta:
        model = WorkspaceMember
        fields = ('id', 'workspace', 'user', 'user_id', 'role', 'joined_at')
        read_only_fields = ('id', 'joined_at')


class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserProfileSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ('id', 'name', 'description', 'owner', 'member_count', 'my_role', 'created_at')
        read_only_fields = ('id', 'owner', 'created_at')

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_my_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(user=request.user).first()
        return membership.role if membership else None


class ChannelSerializer(serializers.ModelSerializer):
    created_by = UserProfileSerializer(read_only=True)

    class Meta:
        model = Channel
        fields = ('id', 'workspace', 'name', 'description', 'is_private', 'created_by', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')


class ReactionSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ('id', 'message', 'user', 'emoji', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class ConvertedTaskPreviewSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Task
        fields = ('id', 'title', 'status', 'priority', 'project', 'project_name')


class MessageSerializer(serializers.ModelSerializer):
    sender = UserProfileSerializer(read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)
    converted_task = serializers.SerializerMethodField()
    reply_to_content = serializers.SerializerMethodField()
    workspace = serializers.PrimaryKeyRelatedField(read_only=True)
    channel = serializers.PrimaryKeyRelatedField(queryset=Channel.objects.all(), required=False, allow_null=True)
    conversation = serializers.PrimaryKeyRelatedField(queryset=Conversation.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Message
        fields = (
            'id', 'workspace', 'channel', 'conversation', 'sender', 'content',
            'attachment_url', 'attachment_name', 'reply_to', 'reply_to_content',
            'is_converted_to_task', 'converted_task', 'reactions', 'created_at', 'edited_at'
        )
        read_only_fields = ('id', 'workspace', 'sender', 'reactions', 'is_converted_to_task', 'converted_task', 'created_at', 'edited_at')

    def get_converted_task(self, obj):
        task = obj.converted_tasks.first()
        if task:
            return ConvertedTaskPreviewSerializer(task).data
        return None

    def get_reply_to_content(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'sender': obj.reply_to.sender.username,
                'content': obj.reply_to.content[:80]
            }
        return None


class ConversationMemberSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = ConversationMember
        fields = ('id', 'user', 'joined_at')


class ConversationSerializer(serializers.ModelSerializer):
    members = ConversationMemberSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'workspace', 'type', 'members', 'last_message', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return {
                'id': msg.id,
                'content': msg.content,
                'sender': msg.sender.username,
                'created_at': msg.created_at
            }
        return None


class TaskCommentSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ('id', 'task', 'user', 'content', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class SourceMessagePreviewSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    channel_name = serializers.CharField(source='channel.name', read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'channel', 'channel_name', 'sender_name', 'content', 'created_at')


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserProfileSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='assignee', write_only=True, required=False, allow_null=True
    )
    created_by = UserProfileSerializer(read_only=True)
    comments_count = serializers.SerializerMethodField()
    source_message_details = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Task
        fields = (
            'id', 'project', 'project_name', 'title', 'description', 'status', 'priority',
            'assignee', 'assignee_id', 'due_date', 'source_message', 'source_message_details',
            'created_by', 'order', 'comments_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'source_message_details', 'project_name', 'comments_count', 'created_at', 'updated_at')

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_source_message_details(self, obj):
        if obj.source_message:
            return SourceMessagePreviewSerializer(obj.source_message).data
        return None


class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserProfileSerializer(read_only=True)
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ('id', 'workspace', 'name', 'description', 'status', 'created_by', 'tasks_count', 'completed_tasks_count', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_completed_tasks_count(self, obj):
        return obj.tasks.filter(status='done').count()


class ConvertMessageToTaskSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.ChoiceField(choices=Task.PRIORITY_CHOICES, default='medium')
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, default='todo')
    assignee_id = serializers.IntegerField(required=False, allow_null=True)
    due_date = serializers.DateField(required=False, allow_null=True)


class PollOptionSerializer(serializers.ModelSerializer):
    votes_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ('id', 'label', 'votes_count', 'has_voted')

    def get_votes_count(self, obj):
        return obj.votes.count()

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.votes.filter(user=request.user).exists()


class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    created_by = UserProfileSerializer(read_only=True)
    total_votes = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ('id', 'workspace', 'channel', 'question', 'is_closed', 'options', 'created_by', 'total_votes', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')

    def get_total_votes(self, obj):
        return PollVote.objects.filter(option__poll=obj).count()


class IdeaSerializer(serializers.ModelSerializer):
    created_by = UserProfileSerializer(read_only=True)
    upvotes_count = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = ('id', 'workspace', 'title', 'description', 'category', 'created_by', 'upvotes_count', 'has_upvoted', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')

    def get_upvotes_count(self, obj):
        return obj.upvotes.count()

    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.upvotes.filter(id=request.user.id).exists()


class ActivityEventSerializer(serializers.ModelSerializer):
    actor = UserProfileSerializer(read_only=True)

    class Meta:
        model = ActivityEvent
        fields = ('id', 'workspace', 'actor', 'event_type', 'target_type', 'target_id', 'description', 'created_at')
        read_only_fields = ('id', 'actor', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserProfileSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'user', 'actor', 'workspace', 'type', 'title', 'message', 'reference_type', 'reference_id', 'is_read', 'created_at')
        read_only_fields = ('id', 'user', 'actor', 'created_at')

