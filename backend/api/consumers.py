import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_key):
    try:
        access_token = AccessToken(token_key)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()


@database_sync_to_async
def is_workspace_member(user, workspace_id):
    if not user or not user.is_authenticated:
        return False
    from .models import WorkspaceMember
    return WorkspaceMember.objects.filter(workspace_id=workspace_id, user=user).exists()


class WorkspaceConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.workspace_id = self.scope['url_route']['kwargs']['workspace_id']
        self.room_group_name = f"workspace_{self.workspace_id}"

        # Extract token from query string
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('token=')[1]
                break

        if token:
            user = await get_user_from_token(token)
            self.scope['user'] = user

        user = self.scope.get('user', AnonymousUser())
        if not user.is_authenticated:
            await self.close(code=4001)
            return

        is_member = await is_workspace_member(user, self.workspace_id)
        if not is_member:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Broadcast online presence
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'workspace_event',
                'event_type': 'user_presence',
                'payload': {
                    'user_id': user.id,
                    'username': user.username,
                    'status': 'online'
                }
            }
        )

    async def disconnect(self, close_code):
        user = self.scope.get('user')
        if user and user.is_authenticated:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'workspace_event',
                    'event_type': 'user_presence',
                    'payload': {
                        'user_id': user.id,
                        'username': user.username,
                        'status': 'offline'
                    }
                }
            )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        """Handle incoming client events like typing indicator."""
        event_type = content.get('type')
        user = self.scope.get('user')

        if event_type in ['typing_start', 'typing_stop']:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'workspace_event',
                    'event_type': event_type,
                    'payload': {
                        'channel_id': content.get('channel_id'),
                        'conversation_id': content.get('conversation_id'),
                        'user_id': user.id,
                        'username': user.username,
                    }
                }
            )

    async def workspace_event(self, event):
        """Handler for group messages."""
        await self.send_json({
            'event': event['event_type'],
            'data': event['payload']
        })
