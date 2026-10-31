import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
import {
  Layers, Plus, LogOut, Sparkles, MessageSquare, CheckSquare, Settings
} from 'lucide-react';

export default function GlobalNavRail() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const { user, logout } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <aside className="w-16 bg-bg-main border-r border-border-subtle flex flex-col items-center py-3 justify-between shrink-0 select-none z-30">
      {/* Top: Brand & Workspace icons */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* HomieLink Icon Badge */}
        <div
          className="group relative h-11 w-11 rounded-2xl bg-gradient-to-tr from-brand-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 transition-all hover:rounded-xl cursor-pointer"
          title="HomieLink — Your people. Your space."
        >
          <Layers className="h-5 w-5" />
          <span className="absolute -left-2 w-1 h-3 bg-brand-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="w-8 h-[1px] bg-border-subtle my-0.5" />

        {/* Workspaces Scrollable List */}
        <div className="flex flex-col items-center gap-2 w-full max-h-[55vh] overflow-y-auto px-2">
          {workspaces.map((ws) => {
            const isActive = activeWorkspace?.id === ws.id;

            return (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspace(ws)}
                title={ws.name}
                className={`group relative h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-xs uppercase transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-primary text-white rounded-xl shadow-md shadow-brand-primary/30 ring-2 ring-brand-primary/40'
                    : 'bg-bg-sidebar text-text-secondary hover:bg-bg-surface hover:text-text-primary hover:rounded-xl border border-border-subtle'
                }`}
              >
                {ws.name.substring(0, 2)}

                {/* Left Active Indicator Pill */}
                {isActive && (
                  <span className="absolute -left-2 w-1.5 h-6 bg-brand-primary rounded-r-full shadow-sm" />
                )}
              </button>
            );
          })}

          {/* Add Workspace Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            title="Create New Workspace"
            className="h-11 w-11 rounded-2xl bg-bg-sidebar border border-dashed border-border-subtle hover:border-brand-primary text-text-muted hover:text-brand-primary flex items-center justify-center transition-all hover:rounded-xl"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom: User Avatar & Profile Menu */}
      <div className="flex flex-col items-center gap-3 w-full relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="relative h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-primary to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase ring-2 ring-border-subtle hover:ring-brand-primary transition-all"
          title={`Signed in as ${user?.username}`}
        >
          {user?.username?.substring(0, 2) || 'HL'}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-status-online border-2 border-bg-main" />
        </button>

        {/* User Popover Menu */}
        {showUserMenu && (
          <div className="absolute left-16 bottom-0 w-60 bg-bg-surface border border-border-subtle rounded-md shadow-2xl p-2 z-50 text-xs">
            <div className="px-3 py-2 border-b border-border-subtle mb-1">
              <div className="font-semibold text-text-primary flex items-center gap-1.5">
                <span>{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-status-online" />
              </div>
              <div className="text-[10px] text-text-muted truncate">@{user?.username} • {user?.email}</div>
            </div>

            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 rounded-md text-status-error hover:bg-status-error/10 flex items-center gap-2 transition-colors font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />
      )}
    </aside>
  );
}
