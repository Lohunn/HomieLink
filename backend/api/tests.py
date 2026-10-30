from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from api.models import (
    User, Workspace, WorkspaceMember, Channel, Message, Reaction,
    Project, Task, Poll, PollOption, PollVote, Idea
)


class HomieLinkCoreTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.alex = User.objects.create_user(
            username='alex',
            email='alex@example.com',
            password='password123'
        )
        self.taylor = User.objects.create_user(
            username='taylor',
            email='taylor@example.com',
            password='password123'
        )
        self.outsider = User.objects.create_user(
            username='outsider',
            email='outsider@example.com',
            password='password123'
        )

        # Authenticate as Alex
        login_res = self.client.post('/api/auth/login/', {
            'username': 'alex',
            'password': 'password123'
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.alex_token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.alex_token}')

    def test_workspace_creation_and_membership(self):
        # Alex creates a workspace
        res = self.client.post('/api/workspaces/', {
            'name': 'Rover Project',
            'description': 'Underground rover safety'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        workspace_id = res.data['id']

        # Verify Alex is owner
        membership = WorkspaceMember.objects.get(workspace_id=workspace_id, user=self.alex)
        self.assertEqual(membership.role, 'owner')

        # Invite Taylor as member
        invite_res = self.client.post(f'/api/workspaces/{workspace_id}/invite_member/', {
            'user_id': self.taylor.id,
            'role': 'member'
        }, format='json')
        self.assertEqual(invite_res.status_code, status.HTTP_201_CREATED)

    def test_conversation_to_action_signature_feature(self):
        # 1. Setup workspace & channel & project
        workspace = Workspace.objects.create(name='Test Workspace', owner=self.alex)
        WorkspaceMember.objects.create(workspace=workspace, user=self.alex, role='owner')
        channel = Channel.objects.create(workspace=workspace, name='software', created_by=self.alex)
        project = Project.objects.create(workspace=workspace, name='Core Platform', created_by=self.alex)

        # 2. Alex posts a message in #software
        msg = Message.objects.create(
            workspace=workspace,
            channel=channel,
            sender=self.alex,
            content='Need to finish the WebSocket telemetry feed by Friday.'
        )
        self.assertFalse(msg.is_converted_to_task)

        # 3. Convert message to task
        convert_res = self.client.post(f'/api/messages/{msg.id}/convert_to_task/', {
            'project_id': project.id,
            'title': 'Finish WebSocket telemetry feed by Friday',
            'description': 'Direct conversion from sprint chat',
            'priority': 'high',
            'status': 'todo'
        }, format='json')
        self.assertEqual(convert_res.status_code, status.HTTP_201_CREATED)

        # 4. Assert task was created and linked to the source message
        task_id = convert_res.data['task']['id']
        task = Task.objects.get(id=task_id)
        self.assertEqual(task.title, 'Finish WebSocket telemetry feed by Friday')
        self.assertEqual(task.source_message.id, msg.id)
        self.assertEqual(task.priority, 'high')

        # 5. Assert source message is flagged as converted
        msg.refresh_from_db()
        self.assertTrue(msg.is_converted_to_task)

    def test_kanban_status_progression(self):
        workspace = Workspace.objects.create(name='Kanban Workspace', owner=self.alex)
        WorkspaceMember.objects.create(workspace=workspace, user=self.alex, role='owner')
        project = Project.objects.create(workspace=workspace, name='Sprint 1', created_by=self.alex)
        task = Task.objects.create(
            project=project,
            title='Setup Tailwind CSS',
            status='todo',
            created_by=self.alex
        )

        # Move to in_progress
        res1 = self.client.patch(f'/api/tasks/{task.id}/update_status/', {
            'status': 'in_progress'
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, 'in_progress')

        # Move to done
        res2 = self.client.patch(f'/api/tasks/{task.id}/update_status/', {
            'status': 'done'
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, 'done')

    def test_task_commenting(self):
        workspace = Workspace.objects.create(name='Comment Workspace', owner=self.alex)
        WorkspaceMember.objects.create(workspace=workspace, user=self.alex, role='owner')
        project = Project.objects.create(workspace=workspace, name='Web System', created_by=self.alex)
        task = Task.objects.create(
            project=project,
            title='Test Commenting',
            created_by=self.alex
        )

        # Add comment
        res = self.client.post(f'/api/tasks/{task.id}/comments/', {
            'content': 'We verified the sensor logs.'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['content'], 'We verified the sensor logs.')

        # Get comments
        get_res = self.client.get(f'/api/tasks/{task.id}/comments/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data), 1)

    def test_reactions(self):
        workspace = Workspace.objects.create(name='Chat Workspace', owner=self.alex)
        WorkspaceMember.objects.create(workspace=workspace, user=self.alex, role='owner')
        channel = Channel.objects.create(workspace=workspace, name='general', created_by=self.alex)
        msg = Message.objects.create(workspace=workspace, channel=channel, sender=self.alex, content='Great work!')

        # Add reaction
        res1 = self.client.post(f'/api/messages/{msg.id}/react/', {'emoji': '🚀'}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(Reaction.objects.filter(message=msg, emoji='🚀').count(), 1)

        # Toggle reaction (removes)
        res2 = self.client.post(f'/api/messages/{msg.id}/react/', {'emoji': '🚀'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(Reaction.objects.filter(message=msg, emoji='🚀').count(), 0)

    def test_idea_upvoting(self):
        workspace = Workspace.objects.create(name='Brainstorm Workspace', owner=self.alex)
        WorkspaceMember.objects.create(workspace=workspace, user=self.alex, role='owner')
        idea = Idea.objects.create(
            workspace=workspace,
            title='Autonomous return on 15% battery',
            created_by=self.alex
        )

        # Upvote
        res = self.client.post(f'/api/ideas/{idea.id}/upvote/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['upvotes_count'], 1)
        self.assertTrue(res.data['has_upvoted'])

    def test_poll_voting(self):
        workspace = Workspace.objects.create(name='Poll Workspace', owner=self.alex)
        WorkspaceMember.objects.create(workspace=workspace, user=self.alex, role='owner')
        poll = Poll.objects.create(workspace=workspace, question='Pick a date', created_by=self.alex)
        opt1 = PollOption.objects.create(poll=poll, label='Friday')
        opt2 = PollOption.objects.create(poll=poll, label='Saturday')

        res = self.client.post(f'/api/polls/{poll.id}/vote/', {'option_id': opt1.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(PollVote.objects.filter(option=opt1, user=self.alex).count(), 1)

    def test_permissions_outsider_blocked(self):
        # Alex's private workspace
        workspace = Workspace.objects.create(name='Private Workspace', owner=self.alex)
        WorkspaceMember.objects.create(workspace=workspace, user=self.alex, role='owner')
        channel = Channel.objects.create(workspace=workspace, name='secret', created_by=self.alex)

        # Authenticate as outsider
        outsider_client = APIClient()
        login_res = outsider_client.post('/api/auth/login/', {
            'username': 'outsider',
            'password': 'password123'
        }, format='json')
        outsider_token = login_res.data['access']
        outsider_client.credentials(HTTP_AUTHORIZATION=f'Bearer {outsider_token}')

        # Outsider tries to list channels of Alex's workspace -> should be empty
        res = outsider_client.get(f'/api/channels/?workspace_id={workspace.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)
