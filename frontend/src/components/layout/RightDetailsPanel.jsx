import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import {
  X, Hash, Users, Shield, ShieldCheck, CheckSquare,
  Pin, FileText, Bell, Sparkles, MessageSquare, ArrowRight, Lock
} from 'lucide-react';

export default function RightDetailsPanel({ onClose, onNavigateToKanban }) {
  const {
    activeChannel, activeConversation, chatType, members,
    onlineUsers, startDirectMessage, setActiveSection
  } = useWorkspace();
  const { user } = useAuth();

  const isChannel = chatType === 'channel';

  return (
    <aside className="w-72 bg-bg-sidebar border-l border-border-subtle flex flex-col h-full shrink-0 select-none z-20 overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 border-b border-border-subtle flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          {isChannel ? (
            <>
              {activeChannel?.is_private ? (
                <Lock className="h-4 w-4 text-brand-primary" />
              ) : (
                <Hash className="h-4 w-4 text-brand-primary" />
              )}
              <span>Channel Details</span>
            </>
          ) : (
            <>
              <Users className="h-4 w-4 text-brand-secondary" />
              <span>Direct Conversation</span>
            </>
          )}
        </h3>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          title="Close details panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* About Section */}
        {isChannel && activeChannel && (
          <div className="p-3.5 rounded-md bg-bg-surface border border-border-subtle">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
              About #{activeChannel.name}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {activeChannel.description || 'Welcome to the channel! Share thoughts, links, and collaborate.'}
            </p>
          </div>
        )}

        {/* HomieLink Signature Feature Shortcut */}
        <div className="p-3.5 rounded-md bg-brand-500/10 border border-brand-primary/30">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-primary mb-1">
            <Sparkles className="h-3.5 w-3.5 text-brand-secondary" />
            <span>Conversation-to-Action</span>
          </div>
          <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">
            Hover over any message to convert it into a task with an automatic backlink.
          </p>
          <button
            onClick={() => {
              if (onNavigateToKanban) onNavigateToKanban();
              else setActiveSection('projects');
            }}
            className="w-full py-1.5 px-3 rounded-md bg-brand-primary hover:bg-brand-hover text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Open Project Board</span>
          </button>
        </div>

        {/* Channel Members List */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2 px-1">
            <span>Members</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-bg-surface text-text-secondary">
              {members.length}
            </span>
          </div>

          <div className="space-y-1">
            {members.map((m) => {
              const isOnline = onlineUsers.has(m.user.id) || m.user.id === user?.id;

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-bg-hover transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Avatar with Presence Indicator */}
                    <div className="relative shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-primary to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                        {m.user.username.substring(0, 2)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-sidebar ${
                          isOnline ? 'bg-status-online' : 'bg-text-muted'
                        }`}
                        title={isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-medium text-text-primary truncate flex items-center gap-1.5">
                        <span>{m.user.first_name ? `${m.user.first_name} ${m.user.last_name || ''}` : m.user.username}</span>
                        {m.user.id === user?.id && (
                          <span className="text-[9px] px-1 rounded bg-bg-surface text-brand-secondary">
                            you
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-muted truncate flex items-center gap-1">
                        {m.role === 'owner' ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                            <Shield className="h-2.5 w-2.5" /> Owner
                          </span>
                        ) : m.role === 'admin' ? (
                          <span className="text-brand-secondary font-semibold flex items-center gap-0.5">
                            <ShieldCheck className="h-2.5 w-2.5" /> Admin
                          </span>
                        ) : (
                          <span>@{m.user.username}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {m.user.id !== user?.id && (
                    <button
                      onClick={() => startDirectMessage(m.user.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-bg-surface text-text-secondary hover:text-text-primary transition-all"
                      title={`Message @${m.user.username}`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pinned & Shared section */}
        <div className="pt-3 border-t border-border-subtle">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2 px-1">
            Pinned & Shared
          </div>
          <div className="space-y-1.5 text-xs text-text-secondary">
            <div className="p-2.5 rounded-md bg-bg-surface/50 border border-border-subtle flex items-center gap-2">
              <Pin className="h-3.5 w-3.5 text-brand-secondary" />
              <span className="truncate">Sprint goals & guidelines</span>
            </div>
            <div className="p-2.5 rounded-md bg-bg-surface/50 border border-border-subtle flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-brand-primary" />
              <span className="truncate">TARA System Architecture Spec</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
