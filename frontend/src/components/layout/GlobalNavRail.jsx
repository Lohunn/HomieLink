import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
import {
  Layers, Plus, Sun, Moon, LogOut, User, Sparkles
} from 'lucide-react';

export default function GlobalNavRail() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <aside className="w-16 bg-slate-950 border-r border-slate-800/80 flex flex-col items-center py-4 justify-between shrink-0 select-none z-30">
      {/* Top: Brand & Workspaces */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* HomieLink App Icon */}
        <div
          className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 mb-1 cursor-pointer"
          title="HomieLink Collaboration"
        >
          <Layers className="h-5 w-5" />
        </div>

        <div className="w-8 h-[1px] bg-slate-800 my-1" />

        {/* Workspaces List */}
        <div className="flex flex-col items-center gap-2.5 w-full max-h-[50vh] overflow-y-auto px-2">
          {workspaces.map((ws) => {
            const isActive = activeWorkspace?.id === ws.id;

            return (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspace(ws)}
                title={ws.name}
                className={`group relative h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs uppercase transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white rounded-xl shadow-md shadow-brand-600/30 ring-2 ring-brand-400/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:rounded-xl'
                }`}
              >
                {ws.name.substring(0, 2)}

                {/* Left Active Indicator Pill */}
                {isActive && (
                  <span className="absolute -left-2 w-1.5 h-6 bg-white rounded-r-full" />
                )}
              </button>
            );
          })}

          {/* Add Workspace Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            title="Create Workspace"
            className="h-10 w-10 rounded-2xl bg-slate-900 border border-dashed border-slate-700 hover:border-brand-500 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:rounded-xl"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom: Theme Toggle & Profile Menu */}
      <div className="flex flex-col items-center gap-3 w-full relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Avatar */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase ring-2 ring-slate-800 hover:ring-brand-500 transition-all"
        >
          {user?.username?.substring(0, 2) || 'HL'}
        </button>

        {/* User Popover Menu */}
        {showUserMenu && (
          <div className="absolute left-16 bottom-0 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs">
            <div className="px-3 py-2 border-b border-slate-800 mb-1">
              <div className="font-semibold text-white">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </div>
              <div className="text-[10px] text-slate-400 truncate">@{user?.username}</div>
            </div>

            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
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

