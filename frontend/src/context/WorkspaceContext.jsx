import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';
import { useWorkspaceSocket } from '../api/ws';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeSection, setActiveSection] = useState('channels'); // default to chat as the star of the app!
  
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatType, setChatType] = useState('channel'); // 'channel' | 'direct'

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  const [members, setMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});

  // Right panel collapsible state (Desktop 3 zones)
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Mobile navigation state ('list' = conversation list, 'chat' = active chat screen)
  const [mobileView, setMobileView] = useState('chat');

  const [loading, setLoading] = useState(true);

  // Fetch user workspaces
  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiRequest('/workspaces/');
      setWorkspaces(data);
      if (data.length > 0 && !activeWorkspace) {
        setActiveWorkspace(data[0]);
      }
    } catch (err) {
      console.error("Failed to load workspaces", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeWorkspace]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Fetch workspace details (channels, direct conversations, projects, members)
  const fetchWorkspaceDetails = useCallback(async () => {
    if (!activeWorkspace) return;

    try {
      const [channelData, projectData, memberData, convData] = await Promise.all([
        apiRequest(`/channels/?workspace_id=${activeWorkspace.id}`),
        apiRequest(`/projects/?workspace_id=${activeWorkspace.id}`),
        apiRequest(`/workspaces/${activeWorkspace.id}/members/`),
        apiRequest('/conversations/')
      ]);

      setChannels(channelData);
      setProjects(projectData);
      setMembers(memberData);
      setConversations(convData);

      if (channelData.length > 0 && !activeChannel && chatType === 'channel') {
        setActiveChannel(channelData[0]);
      }
      if (projectData.length > 0 && !activeProject) {
        setActiveProject(projectData[0]);
      }
    } catch (err) {
      console.error("Failed to load workspace details", err);
    }
  }, [activeWorkspace, activeChannel, activeProject, chatType]);

  useEffect(() => {
    fetchWorkspaceDetails();
  }, [activeWorkspace]);

  // Handle incoming real-time events from Channels WebSocket
  const handleSocketEvent = useCallback((event) => {
    const { event: type, data } = event;
    if (!type) return;

    if (type === 'channel_created') {
      setChannels(prev => [...prev.filter(c => c.id !== data.id), data]);
    } else if (type === 'project_created') {
      setProjects(prev => [...prev.filter(p => p.id !== data.id), data]);
    } else if (type === 'member_joined') {
      fetchWorkspaceDetails();
    } else if (type === 'user_presence') {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (data.status === 'online') {
          next.add(data.user_id);
        } else {
          next.delete(data.user_id);
        }
        return next;
      });
    } else if (type === 'typing_start') {
      setTypingUsers(prev => ({
        ...prev,
        [data.channel_id || data.conversation_id]: data.username
      }));
    } else if (type === 'typing_stop') {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[data.channel_id || data.conversation_id];
        return next;
      });
    }
  }, [fetchWorkspaceDetails]);

  const { isConnected, sendEvent } = useWorkspaceSocket(
    activeWorkspace ? activeWorkspace.id : null,
    handleSocketEvent
  );

  const selectChannel = (channel) => {
    setActiveChannel(channel);
    setChatType('channel');
    setActiveSection('channels');
    setMobileView('chat');
  };

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    setChatType('direct');
    setActiveSection('channels');
    setMobileView('chat');
  };

  const startDirectMessage = async (targetUserId) => {
    try {
      const conv = await apiRequest('/conversations/', {
        method: 'POST',
        body: JSON.stringify({
          user_id: targetUserId,
          workspace_id: activeWorkspace?.id
        })
      });
      setConversations(prev => [...prev.filter(c => c.id !== conv.id), conv]);
      selectConversation(conv);
      return conv;
    } catch (err) {
      console.error("Failed to start DM", err);
    }
  };

  const createWorkspace = async (name, description) => {
    const data = await apiRequest('/workspaces/', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    });
    setWorkspaces(prev => [...prev, data]);
    setActiveWorkspace(data);
    return data;
  };

  const createChannel = async (name, description, isPrivate = false) => {
    if (!activeWorkspace) return;
    const data = await apiRequest('/channels/', {
      method: 'POST',
      body: JSON.stringify({
        workspace: activeWorkspace.id,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        is_private: isPrivate
      })
    });
    setChannels(prev => [...prev, data]);
    selectChannel(data);
    return data;
  };

  const createProject = async (name, description) => {
    if (!activeWorkspace) return;
    const data = await apiRequest('/projects/', {
      method: 'POST',
      body: JSON.stringify({
        workspace: activeWorkspace.id,
        name,
        description
      })
    });
    setProjects(prev => [...prev, data]);
    setActiveProject(data);
    return data;
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      setActiveWorkspace,
      activeSection,
      setActiveSection,
      channels,
      activeChannel,
      selectChannel,
      conversations,
      activeConversation,
      selectConversation,
      startDirectMessage,
      chatType,
      projects,
      activeProject,
      setActiveProject,
      members,
      onlineUsers,
      typingUsers,
      showRightPanel,
      setShowRightPanel,
      toggleRightPanel: () => setShowRightPanel(prev => !prev),
      mobileView,
      setMobileView,
      loading,
      isConnected,
      sendEvent,
      refreshWorkspaces: fetchWorkspaces,
      refreshDetails: fetchWorkspaceDetails,
      createWorkspace,
      createChannel,
      createProject,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
