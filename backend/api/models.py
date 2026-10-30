from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True, default='')
    avatar_url = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class Workspace(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default='')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_workspaces')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class WorkspaceMember(models.Model):
    ROLE_CHOICES = (
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('member', 'Member'),
        ('guest', 'Guest'),
    )

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workspace_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('workspace', 'user')

    def __str__(self):
        return f"{self.user.username} ({self.role}) in {self.workspace.name}"


class Channel(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='channels')
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True, default='')
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_channels')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('workspace', 'name')

    def __str__(self):
        return f"#{self.name} ({self.workspace.name})"


class Conversation(models.Model):
    CONV_TYPE = (
        ('direct', 'Direct Message'),
        ('group', 'Group Chat'),
    )
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, null=True, blank=True, related_name='conversations')
    type = models.CharField(max_length=20, choices=CONV_TYPE, default='direct')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversation {self.id} ({self.type})"


class ConversationMember(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversation_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f"{self.user.username} in Conv #{self.conversation.id}"


class Message(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='messages')
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, null=True, blank=True, related_name='messages')
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, null=True, blank=True, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    attachment_url = models.TextField(blank=True, default='')
    attachment_name = models.CharField(max_length=255, blank=True, default='')
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    is_converted_to_task = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg {self.id} by {self.sender.username}: {self.content[:30]}"


class Reaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_reactions')
    emoji = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} on Msg {self.message.id}"


class Project(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    )

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.workspace.name})"


class Task(models.Model):
    STATUS_CHOICES = (
        ('backlog', 'Backlog'),
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('review', 'Review'),
        ('done', 'Done'),
    )
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    due_date = models.DateField(null=True, blank=True)
    # Signature Feature: Link to source message
    source_message = models.ForeignKey(
        Message,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='converted_tasks'
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tasks')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"[{self.status}] {self.title}"


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on Task {self.task.id}"


class Poll(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='polls')
    channel = models.ForeignKey(Channel, on_delete=models.SET_NULL, null=True, blank=True, related_name='polls')
    question = models.CharField(max_length=255)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_polls')
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question


class PollOption(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='options')
    label = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.label} (Poll {self.poll.id})"


class PollVote(models.Model):
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='poll_votes')
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('option', 'user')

    def __str__(self):
        return f"{self.user.username} -> {self.option.label}"


class Idea(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='ideas')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=80, blank=True, default='General')
    upvotes = models.ManyToManyField(User, related_name='upvoted_ideas', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_ideas')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ActivityEvent(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='activity_events')
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='actions')
    event_type = models.CharField(max_length=50) # task_created, task_updated, message_converted, member_joined, etc.
    target_type = models.CharField(max_length=50, blank=True, default='') # task, message, channel, project
    target_id = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.event_type}] {self.description}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=50) # task_assigned, mention, reply, conv_to_action
    title = models.CharField(max_length=150)
    message = models.TextField()
    reference_type = models.CharField(max_length=50, blank=True, default='')
    reference_id = models.PositiveIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"
