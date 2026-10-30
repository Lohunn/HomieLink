from rest_framework import permissions
from .models import WorkspaceMember

class IsWorkspaceMember(permissions.BasePermission):
    """
    Allows access only to authenticated users who are members of the target workspace.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        workspace_id = (
            view.kwargs.get('workspace_id') or
            request.query_params.get('workspace_id') or
            request.data.get('workspace') or
            request.data.get('workspace_id')
        )
        if not workspace_id:
            # Let view-level get_queryset handle filtering if no explicit ID in path
            return True
            
        return WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists()


class IsWorkspaceAdminOrOwner(permissions.BasePermission):
    """
    Allows access only to workspace owners and admins.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        workspace_id = (
            view.kwargs.get('workspace_id') or
            request.query_params.get('workspace_id') or
            request.data.get('workspace') or
            request.data.get('workspace_id')
        )
        if not workspace_id:
            return True
            
        return WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            user=request.user,
            role__in=['owner', 'admin']
        ).exists()
