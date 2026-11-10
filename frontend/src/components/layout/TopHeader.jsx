import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import NotificationsPopover from '../notifications/NotificationsPopover';
import {
  Search, Bell, Hash, Lock, Users, Sidebar, ChevronLeft,
  Sparkles, CheckSquare, MoreVertical, Phone, Video, Compass, HelpCircle
} from 'lucide-react';

export default function TopHeader({ onOpenSearch, onOpenOnboarding }) {
  const {
    activeChannel, activeConversation, chatType, activeSection,
    isConnected, showRightPanel, toggleRightPanel,
    mobileView, setMobileView
  } = useWorkspace();

  const [showNotifications, setShowNotifications] = useState(false);

  const isChannel = chatType === 'channel';

  return (
    <header className="h-16 bg-bg-main border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: Active Title & Mobile Back button */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile back button if in active chat on small screen */}
        {activeSection === 'channels' && mobileView === 'chat' && (
          <button
            onClick={() => setMobileView('list')}
            className="sm:hidden p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            title="Back to conversation list"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {activeSection === 'channels' ? (
          isChannel && activeChannel ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-md bg-bg-surface flex items-center justify-center text-brand-primary shrink-0">
                {activeChannel.is_private ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-text-primary truncate">
                    #{activeChannel.name}
                  </h2>
                </div>
                <p className="text-[11px] text-text-secondary truncate max-w-xs sm:max-w-md">
                  {activeChannel.description || 'Topic discussions for the team'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-md bg-bg-surface flex items-center justify-center text-brand-secondary shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-text-primary truncate">
                  Direct Conversation
                </h2>
                <span className="text-[11px] text-status-online flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-online" /> Direct Message
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="text-sm font-bold text-text-primary capitalize">
            {activeSection === 'projects' ? 'Project Board (Kanban)' :
             activeSection === 'ideas' ? 'Brainstorm Ideas & Polls' :
             activeSection === 'activity' ? 'Activity Feed' :
             activeSection === 'members' ? 'Workspace Members' : 'Overview'}
          </div>
        )}
      </div>

      {/* Center Search Trigger */}
      <button
        onClick={onOpenSearch}
        className="hidden md:flex items-center gap-3 bg-bg-surface hover:bg-bg-hover border border-border-subtle px-3.5 py-1.5 rounded-md text-xs text-text-muted hover:text-text-primary transition-all w-64"
      >
        <Search className="h-3.5 w-3.5 text-text-muted" />
        <span className="flex-1 text-left">Search HomieLink...</span>
        <kbd className="text-[10px] bg-bg-hover border border-border-subtle px-1.5 py-0.5 rounded text-text-secondary">
          Ctrl K
        </kbd>
      </button>

      {/* Right Controls: Real-time Live Badge, Dedicated Onboard Button, Notifications, Details Panel Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dedicated Onboarding Tour Button */}
        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm"
            title="Start Workspace Onboarding & Interactive Tour"
          >
            <Compass className="h-3.5 w-3.5 animate-spin-slow" />
            <span className="hidden sm:inline">Tour & Onboard</span>
          </button>
        )}

        {/* Live WebSocket Sync Pill */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
            isConnected
              ? 'bg-status-online/10 border-status-online/30 text-status-online'
              : 'bg-status-away/10 border-status-away/30 text-status-away'
          }`}
          title={isConnected ? 'Real-time WebSocket Live' : 'Connecting to real-time events...'}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-status-online animate-pulse' : 'bg-status-away'
            }`}
          />
          <span>{isConnected ? 'Live' : 'Syncing'}</span>
        </div>

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          {showNotifications && (
            <NotificationsPopover onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* Toggle Right Details Panel Button (Desktop Screen 01 3-zone layout) */}
        {activeSection === 'channels' && (
          <button
            onClick={toggleRightPanel}
            className={`p-2 rounded-md transition-colors ${
              showRightPanel
                ? 'bg-brand-primary/15 text-brand-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
            title={showRightPanel ? 'Hide details panel' : 'Show details panel'}
          >
            <Sidebar className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}
