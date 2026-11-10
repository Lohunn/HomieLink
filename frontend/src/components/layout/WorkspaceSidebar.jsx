import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import CreateChannelModal from '../channel/CreateChannelModal';
import {
  Hash, Plus, Lock, ChevronDown, ChevronRight, MessageSquare,
  FolderKanban, Lightbulb, Activity, Users, Search, Mic, MicOff,
  Headphones, Settings, Shield, ShieldCheck, Sparkles, Compass
} from 'lucide-react';

export default function WorkspaceSidebar({ onOpenSearch, onOpenOnboarding }) {
  const {
    activeWorkspace, activeSection, setActiveSection,
    channels, activeChannel, selectChannel,
    members, onlineUsers, startDirectMessage,
    activeConversation, selectConversation, chatType, conversations
  } = useWorkspace();
  const { user } = useAuth();

  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  if (!activeWorkspace) {
    return (
      <div className="w-64 bg-bg-sidebar border-r border-border-subtle p-4 text-xs text-text-muted">
        No active workspace
      </div>
    );
  }

  const isOwner = activeWorkspace.my_role === 'owner';
  const isAdmin = activeWorkspace.my_role === 'admin' || isOwner;

  // Filter channels & members by searchFilter
  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const filteredMembers = members.filter(m =>
    m.user.id !== user?.id &&
    (m.user.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
     (m.user.first_name && m.user.first_name.toLowerCase().includes(searchFilter.toLowerCase())))
  );

  return (
    <aside className="w-64 bg-bg-sidebar border-r border-border-subtle flex flex-col shrink-0 select-none h-full overflow-hidden">
      {/* Workspace Header */}
      <div className="h-16 px-4 border-b border-border-subtle flex items-center justify-between shrink-0 bg-bg-sidebar/80 backdrop-blur">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-sm font-bold text-text-primary truncate tracking-tight" title={activeWorkspace.name}>
            {activeWorkspace.name}
          </h2>
          <span className="inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-bg-surface text-brand-primary border border-border-subtle">
            {activeWorkspace.my_role || 'member'}
          </span>
        </div>
      </div>

      {/* Quick Search Conversations Bar */}
      <div className="p-3 border-b border-border-subtle">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search channels & DMs..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-bg-surface border border-border-subtle rounded-md pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-primary transition-colors"
          />
        </div>
      </div>

      {/* Main Nav / Sections Quick Links */}
      <div className="p-2 border-b border-border-subtle space-y-0.5">
        <button
          onClick={() => setActiveSection('channels')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeSection === 'channels'
              ? 'bg-brand-primary text-white font-semibold shadow-sm shadow-brand-primary/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Conversations</span>
        </button>

        <button
          onClick={() => setActiveSection('projects')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeSection === 'projects'
              ? 'bg-brand-primary text-white font-semibold shadow-sm shadow-brand-primary/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          <span>Project Board</span>
        </button>

        <button
          onClick={() => setActiveSection('ideas')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeSection === 'ideas'
              ? 'bg-brand-primary text-white font-semibold shadow-sm shadow-brand-primary/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          <span>Ideas & Polls</span>
        </button>

        <button
          onClick={() => setActiveSection('activity')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeSection === 'activity'
              ? 'bg-brand-primary text-white font-semibold shadow-sm shadow-brand-primary/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Activity Feed</span>
        </button>

        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-brand-primary hover:bg-brand-primary/10 border border-brand-primary/20 transition-all mt-1"
          >
            <Compass className="h-4 w-4" />
            <span className="font-semibold">Quick Guide / Tour</span>
          </button>
        )}
      </div>

      {/* Scrollable Conversation Lists */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* CHANNELS ACCORDION */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-text-muted group">
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary"
            >
              {channelsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>Channels</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowChannelModal(true)}
                title="Create Channel"
                className="p-1 rounded hover:bg-bg-surface text-text-muted hover:text-text-primary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {channelsExpanded && (
            <div className="mt-1 space-y-0.5">
              {filteredChannels.map((ch) => {
                const isSelected = activeSection === 'channels' && chatType === 'channel' && activeChannel?.id === ch.id;

                return (
                  <button
                    key={ch.id}
                    onClick={() => selectChannel(ch)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group ${
                      isSelected
                        ? 'bg-bg-surface text-text-primary font-semibold border-l-2 border-brand-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {ch.is_private ? (
                        <Lock className={`h-3.5 w-3.5 ${isSelected ? 'text-brand-primary' : 'text-text-muted'}`} />
                      ) : (
                        <Hash className={`h-3.5 w-3.5 ${isSelected ? 'text-brand-primary' : 'text-text-muted'}`} />
                      )}
                      <span className="truncate">{ch.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* DIRECT MESSAGES ACCORDION */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-text-muted group">
            <button
              onClick={() => setDmsExpanded(!dmsExpanded)}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary"
            >
              {dmsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>Direct Messages</span>
            </button>
          </div>

          {dmsExpanded && (
            <div className="mt-1 space-y-0.5">
              {filteredMembers.map((m) => {
                const isOnline = onlineUsers.has(m.user.id);

                return (
                  <button
                    key={m.id}
                    onClick={() => startDirectMessage(m.user.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors group"
                  >
                    <div className="relative shrink-0">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-brand-primary to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {m.user.username.substring(0, 2)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-bg-sidebar ${
                          isOnline ? 'bg-status-online' : 'bg-text-muted'
                        }`}
                      />
                    </div>

                    <span className="truncate flex-1 text-left">
                      {m.user.first_name ? `${m.user.first_name} ${m.user.last_name || ''}` : m.user.username}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom User Profile Controls Bar */}
      <div className="h-14 px-3 border-t border-border-subtle bg-bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-primary to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
              {user?.username?.substring(0, 2)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-status-online border border-bg-surface" />
          </div>

          <div className="min-w-0">
            <div className="text-xs font-semibold text-text-primary truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              @{user?.username}
            </div>
          </div>
        </div>
      </div>

      {showChannelModal && (
        <CreateChannelModal onClose={() => setShowChannelModal(false)} />
      )}
    </aside>
  );
}
