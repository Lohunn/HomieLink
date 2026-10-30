import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import CreateChannelModal from '../channel/CreateChannelModal';
import {
  LayoutDashboard, Hash, FolderKanban, Lightbulb, Activity,
  Users, Plus, ChevronDown, ChevronRight, Lock, Sparkles, MessageSquare
} from 'lucide-react';

export default function WorkspaceSidebar() {
  const {
    activeWorkspace, activeSection, setActiveSection,
    channels, activeChannel, setActiveChannel
  } = useWorkspace();

  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelsExpanded, setChannelsExpanded] = useState(true);

  if (!activeWorkspace) {
    return (
      <div className="w-60 bg-slate-900/90 border-r border-slate-800 p-4 text-xs text-slate-500">
        No workspace active
      </div>
    );
  }

  const isOwner = activeWorkspace.my_role === 'owner';
  const isAdmin = activeWorkspace.my_role === 'admin' || isOwner;

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Workspace Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-xs font-bold text-white truncate" title={activeWorkspace.name}>
            {activeWorkspace.name}
          </h2>
          <span className="inline-block text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-brand-400 border border-slate-700/60">
            {activeWorkspace.my_role || 'member'}
          </span>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Sections list */}
        <div className="space-y-0.5">
          {/* Overview */}
          <button
            onClick={() => setActiveSection('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'overview'
                ? 'bg-brand-600/15 text-brand-300 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </button>

          {/* Kanban Projects */}
          <button
            onClick={() => setActiveSection('projects')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'projects'
                ? 'bg-brand-600/15 text-brand-300 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            <span>Projects & Tasks</span>
          </button>

          {/* Ideas & Polls */}
          <button
            onClick={() => setActiveSection('ideas')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'ideas'
                ? 'bg-brand-600/15 text-brand-300 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            <span>Ideas & Polls</span>
          </button>

          {/* Activity */}
          <button
            onClick={() => setActiveSection('activity')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'activity'
                ? 'bg-brand-600/15 text-brand-300 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Activity Feed</span>
          </button>

          {/* Members */}
          <button
            onClick={() => setActiveSection('members')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeSection === 'members'
                ? 'bg-brand-600/15 text-brand-300 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Members</span>
          </button>
        </div>

        {/* Channels Section Header */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-slate-400 group">
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white"
            >
              {channelsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>Channels</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowChannelModal(true)}
                title="Create Channel"
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Channels List */}
          {channelsExpanded && (
            <div className="mt-1 space-y-0.5">
              {channels.map((ch) => {
                const isSelected = activeSection === 'channels' && activeChannel?.id === ch.id;

                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannel(ch);
                      setActiveSection('channels');
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    {ch.is_private ? (
                      <Lock className="h-3.5 w-3.5 text-slate-500" />
                    ) : (
                      <Hash className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showChannelModal && (
        <CreateChannelModal onClose={() => setShowChannelModal(false)} />
      )}
    </aside>
  );
}

