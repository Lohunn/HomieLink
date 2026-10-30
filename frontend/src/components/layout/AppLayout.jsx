import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import GlobalNavRail from './GlobalNavRail';
import WorkspaceSidebar from './WorkspaceSidebar';
import TopHeader from './TopHeader';
import WorkspaceOverviewView from '../overview/WorkspaceOverviewView';
import ChannelChatView from '../chat/ChannelChatView';
import KanbanBoardView from '../kanban/KanbanBoardView';
import IdeasAndPollsView from '../ideas/IdeasAndPollsView';
import ActivityFeedView from '../activity/ActivityFeedView';
import MembersView from '../members/MembersView';
import GlobalSearchModal from '../search/GlobalSearchModal';

export default function AppLayout() {
  const { activeSection, setActiveSection, channels, setActiveChannel } = useWorkspace();
  const [showSearch, setShowSearch] = useState(false);

  // Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleJumpToChannel = (channelId) => {
    const target = channels.find((c) => c.id === channelId);
    if (target) {
      setActiveChannel(target);
      setActiveSection('channels');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Global Workspace Rail */}
      <GlobalNavRail />

      {/* 2. Workspace Navigation Sidebar */}
      <WorkspaceSidebar />

      {/* 3. Main Stage Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <TopHeader onOpenSearch={() => setShowSearch(true)} />

        {/* Dynamic Section Stage */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeSection === 'overview' && <WorkspaceOverviewView />}
          {activeSection === 'channels' && (
            <ChannelChatView onNavigateToTask={() => setActiveSection('projects')} />
          )}
          {activeSection === 'projects' && (
            <KanbanBoardView onJumpToChannel={handleJumpToChannel} />
          )}
          {activeSection === 'ideas' && <IdeasAndPollsView />}
          {activeSection === 'activity' && <ActivityFeedView />}
          {activeSection === 'members' && <MembersView />}
        </main>
      </div>

      {/* Global Spotlight Search Modal */}
      {showSearch && (
        <GlobalSearchModal
          onClose={() => setShowSearch(false)}
          onSelectChannel={(c) => {
            setActiveChannel(c);
            setActiveSection('channels');
          }}
          onSelectTask={() => {
            setActiveSection('projects');
          }}
        />
      )}
    </div>
  );
}
