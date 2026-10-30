import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import NotificationsPopover from '../notifications/NotificationsPopover';
import {
  Search, Bell, Wifi, WifiOff, ChevronRight, Layers, Users
} from 'lucide-react';

export default function TopHeader({ onOpenSearch }) {
  const { activeWorkspace, activeSection, isConnected, onlineUsers, members } = useWorkspace();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
      {/* Breadcrumb Path */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-brand-400" />
          {activeWorkspace?.name || 'HomieLink'}
        </span>
        <ChevronRight className="h-3 w-3 text-slate-600" />
        <span className="capitalize text-slate-400 font-medium">{activeSection}</span>
      </div>

      {/* Center Search trigger */}
      <button
        onClick={onOpenSearch}
        className="hidden sm:flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-all w-72"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search workspace...</span>
        <kbd className="text-[10px] bg-slate-700/80 px-1.5 py-0.5 rounded text-slate-300">
          Ctrl K
        </kbd>
      </button>

      {/* Right Tools: Presence, Notifications */}
      <div className="flex items-center gap-3 relative">
        {/* Real-time Connection Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
          }`}
          title={isConnected ? 'Real-time WebSocket Live' : 'Connecting to real-time events...'}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="hidden md:inline">{isConnected ? 'Live Sync' : 'Reconnecting'}</span>
        </div>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          {showNotifications && (
            <NotificationsPopover onClose={() => setShowNotifications(false)} />
          )}
        </div>
      </div>
    </header>
  );
}

