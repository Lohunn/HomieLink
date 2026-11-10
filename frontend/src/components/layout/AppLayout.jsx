import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import GlobalNavRail from './GlobalNavRail';
import WorkspaceSidebar from './WorkspaceSidebar';
import TopHeader from './TopHeader';
import RightDetailsPanel from './RightDetailsPanel';
import MobileNavigation from './MobileNavigation';
import ChannelChatView from '../chat/ChannelChatView';
import KanbanBoardView from '../kanban/KanbanBoardView';
import IdeasAndPollsView from '../ideas/IdeasAndPollsView';
import ActivityFeedView from '../activity/ActivityFeedView';
import MembersView from '../members/MembersView';
import GlobalSearchModal from '../search/GlobalSearchModal';
import OnboardingModal from './OnboardingModal';

export default function AppLayout() {
  const {
    activeSection, setActiveSection,
    showRightPanel, toggleRightPanel,
    mobileView, setMobileView,
    channels, selectChannel
  } = useWorkspace();
  const [showSearch, setShowSearch] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      selectChannel(target);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-main font-sans text-text-primary">
      {/* 1. Global Navigation Rail (Desktop) */}
      <div className="hidden sm:flex">
        <GlobalNavRail />
      </div>

      {/* 2. Workspace Sidebar (Channels & DMs) */}
      {/* On mobile, hidden when viewing active chat */}
      <div className={`${mobileView === 'chat' && activeSection === 'channels' ? 'hidden sm:flex' : 'flex'} h-full w-full sm:w-auto`}>
        <WorkspaceSidebar
          onOpenSearch={() => setShowSearch(true)}
          onOpenOnboarding={() => setShowOnboarding(true)}
        />
      </div>

      {/* 3. Center Main Stage */}
      {/* On mobile, hidden when viewing conversation list */}
      <div className={`${mobileView === 'list' && activeSection === 'channels' ? 'hidden sm:flex' : 'flex'} flex-1 flex flex-col min-w-0 h-full overflow-hidden pb-14 sm:pb-0`}>
        {/* Top Header */}
        <TopHeader
          onOpenSearch={() => setShowSearch(true)}
          onOpenOnboarding={() => setShowOnboarding(true)}
        />

        {/* Dynamic Section Stage */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          <main className="flex-1 overflow-hidden flex flex-col min-w-0">
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

          {/* 4. Collapsible Right Conversation Details Panel (Desktop 3 zones) */}
          {activeSection === 'channels' && showRightPanel && (
            <div className="hidden lg:flex h-full">
              <RightDetailsPanel
                onClose={toggleRightPanel}
                onNavigateToKanban={() => setActiveSection('projects')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavigation />

      {/* Global Spotlight Search Modal */}
      {showSearch && (
        <GlobalSearchModal
          onClose={() => setShowSearch(false)}
          onSelectChannel={(c) => {
            selectChannel(c);
          }}
          onSelectTask={() => {
            setActiveSection('projects');
          }}
        />
      )}

      {/* Interactive Onboarding & Workspace Tour Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}
