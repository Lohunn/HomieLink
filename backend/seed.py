import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import (
    User, Workspace, WorkspaceMember, Channel, Message, Reaction,
    Project, Task, Poll, PollOption, PollVote, Idea, ActivityEvent
)

def seed():
    print("Clearing old data (if any)...")
    Workspace.objects.all().delete()
    User.objects.all().delete()

    print("Creating demo users...")
    alex = User.objects.create_user(
        username='alex',
        email='alex@homielink.dev',
        password='password123',
        first_name='Alex',
        last_name='Rivera',
        bio='Hardware & Robotics enthusiast. Team Lead for TARA.'
    )
    sam = User.objects.create_user(
        username='sam',
        email='sam@homielink.dev',
        password='password123',
        first_name='Sam',
        last_name='Chen',
        bio='Product designer & CAD modeler.'
    )
    taylor = User.objects.create_user(
        username='taylor',
        email='taylor@homielink.dev',
        password='password123',
        first_name='Taylor',
        last_name='Morgan',
        bio='Full-stack & embedded firmware developer.'
    )

    print("Creating Workspace: TARA — Mine Safety Rover...")
    tara = Workspace.objects.create(
        name='TARA — Mine Safety Rover',
        description='Autonomous rover designed for underground mining safety and hazardous gas detection.',
        owner=alex
    )

    # Workspace memberships
    WorkspaceMember.objects.create(workspace=tara, user=alex, role='owner')
    WorkspaceMember.objects.create(workspace=tara, user=sam, role='admin')
    WorkspaceMember.objects.create(workspace=tara, user=taylor, role='member')

    print("Creating Channels...")
    general = Channel.objects.create(
        workspace=tara,
        name='general',
        description='General team announcements and sync-ups',
        created_by=alex
    )
    hardware = Channel.objects.create(
        workspace=tara,
        name='hardware',
        description='Chassis, LiDAR, motor drivers and battery systems',
        created_by=alex
    )
    software = Channel.objects.create(
        workspace=tara,
        name='software',
        description='ROS2 nodes, telemetry streaming and React dashboard',
        created_by=taylor
    )

    print("Creating Projects...")
    rover_core = Project.objects.create(
        workspace=tara,
        name='Rover Core System',
        description='Hardware chassis and embedded motor controllers',
        created_by=alex
    )
    telemetry = Project.objects.create(
        workspace=tara,
        name='Telemetry Dashboard',
        description='Web-based real-time telemetry and hazard alert dashboard',
        created_by=taylor
    )

    print("Posting initial messages...")
    m1 = Message.objects.create(
        workspace=tara,
        channel=general,
        sender=alex,
        content="Welcome to the HomieLink workspace for Project TARA! Let's get our sprint goals locked in before Friday."
    )
    Reaction.objects.create(message=m1, user=sam, emoji='🚀')
    Reaction.objects.create(message=m1, user=taylor, emoji='🙌')

    m2 = Message.objects.create(
        workspace=tara,
        channel=software,
        sender=taylor,
        content="I have the ROS2 WebSocket bridge running. Need to finish the WebSocket telemetry feed by Friday."
    )

    # Demonstrate Signature Feature: Convert message into task
    task1 = Task.objects.create(
        project=telemetry,
        title='Finish WebSocket telemetry feed by Friday',
        description='Converted from chat message by Taylor: ROS2 WebSocket bridge telemetry connection.',
        status='in_progress',
        priority='high',
        assignee=taylor,
        source_message=m2,
        created_by=alex
    )
    m2.is_converted_to_task = True
    m2.save()

    Task.objects.create(
        project=rover_core,
        title='Calibrate LiDAR sensor for dark mine shafts',
        description='Test distance readings and threshold noise filtering.',
        status='todo',
        priority='urgent',
        assignee=alex,
        created_by=alex
    )

    Task.objects.create(
        project=rover_core,
        title='Order replacement step-down voltage regulators',
        description='Need 24V to 5V 10A buck converters.',
        status='backlog',
        priority='medium',
        assignee=sam,
        created_by=alex
    )

    Task.objects.create(
        project=telemetry,
        title='Design dark mode theme for telemetry charts',
        description='Ensure high contrast for gas concentration graphs in field testing.',
        status='review',
        priority='medium',
        assignee=sam,
        created_by=taylor
    )

    Task.objects.create(
        project=telemetry,
        title='Setup Vite + Tailwind app shell',
        description='Initial foundation for team dashboard.',
        status='done',
        priority='high',
        assignee=taylor,
        created_by=alex
    )

    print("Creating Ideas & Poll...")
    poll = Poll.objects.create(
        workspace=tara,
        channel=general,
        question='What color scheme should we use for high gas concentration warning alerts?',
        created_by=alex
    )
    opt1 = PollOption.objects.create(poll=poll, label='Vibrant Amber (#f59e0b)')
    opt2 = PollOption.objects.create(poll=poll, label='High Contrast Crimson (#ef4444)')
    opt3 = PollOption.objects.create(poll=poll, label='Flashing Neon Yellow (#eab308)')
    PollVote.objects.create(option=opt2, user=alex)
    PollVote.objects.create(option=opt2, user=taylor)
    PollVote.objects.create(option=opt1, user=sam)

    idea1 = Idea.objects.create(
        workspace=tara,
        title='Add autonomous return-to-base on low battery (<15%)',
        description='If telemetry packet drops or battery level hits 15%, rover triggers waypoint return.',
        category='Robotics',
        created_by=alex
    )
    idea1.upvotes.add(alex, sam, taylor)

    Idea.objects.create(
        workspace=tara,
        title='Offline mesh networking using LoRa between rovers',
        description='Allows rovers to relay hazard maps even deep in tunnels without Wi-Fi.',
        category='Networking',
        created_by=taylor
    )

    print("Logging activity events...")
    ActivityEvent.objects.create(
        workspace=tara,
        actor=alex,
        event_type='workspace_created',
        target_type='workspace',
        target_id=tara.id,
        description='Created workspace TARA — Mine Safety Rover'
    )
    ActivityEvent.objects.create(
        workspace=tara,
        actor=alex,
        event_type='message_converted',
        target_type='task',
        target_id=task1.id,
        description="Converted message into task: 'Finish WebSocket telemetry feed by Friday'"
    )

    print("\nDatabase seeded successfully!")
    print("Demo accounts:")
    print("  - alex@homielink.dev / password123 (Owner)")
    print("  - sam@homielink.dev / password123 (Admin)")
    print("  - taylor@homielink.dev / password123 (Member)")

if __name__ == '__main__':
    seed()

