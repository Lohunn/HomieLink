import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare, Lightbulb, FolderKanban, CheckSquare, Sparkles,
  Users, Hash, ArrowRight, Shield, Rocket, Activity, Zap
} from 'lucide-react';

export default function WorkspaceOverviewView() {
  const {
    activeWorkspace, channels, projects, members, setActiveSection, setActiveChannel
  } = useWorkspace();
  const { user } = useAuth();

  const totalTasks = projects.reduce((acc, p) => acc + (p.tasks_count || 0), 0);
  const completedTasks = projects.reduce((acc, p) => acc + (p.completed_tasks_count || 0), 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-900 space-y-8">
      {/* Workspace Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-slate-900 to-slate-950 border border-brand-500/20 p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            HomieLink Collaboration Hub
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            {activeWorkspace?.name || 'Workspace Overview'}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {activeWorkspace?.description || 'Your team collaboration platform for brainstorming, planning, and building projects together.'}
          </p>

          {/* Core Product Loop Pill */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Core Loop:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-medium">Connect</span>
            <ArrowRight className="h-3 w-3 text-slate-500" />
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-medium">Brainstorm</span>
            <ArrowRight className="h-3 w-3 text-slate-500" />
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-medium">Plan</span>
            <ArrowRight className="h-3 w-3 text-slate-500" />
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-medium">Create</span>
            <ArrowRight className="h-3 w-3 text-slate-500" />
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">Complete 🎉</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Team Members</p>
            <h3 className="text-2xl font-bold text-white mt-1">{members.length}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Channels</p>
            <h3 className="text-2xl font-bold text-white mt-1">{channels.length}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Hash className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projects</p>
            <h3 className="text-2xl font-bold text-white mt-1">{projects.length}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <FolderKanban className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Task Completion</p>
            <h3 className="text-2xl font-bold text-white mt-1">{completionRate}%</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckSquare className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Quick Launchpad Action Cards */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
          Collaboration Launchpad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Connect in Chat */}
          <div
            onClick={() => {
              if (channels.length > 0) setActiveChannel(channels[0]);
              setActiveSection('channels');
            }}
            className="group p-6 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-brand-500/40 cursor-pointer transition-all shadow-sm"
          >
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
              1. Connect & Communicate
            </h4>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              Hop into #{channels[0]?.name || 'general'} to discuss with your team. Remember: any message can be converted into an action item!
            </p>
            <span className="text-xs font-semibold text-brand-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Open Channel <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Action 2: Brainstorm Ideas & Polls */}
          <div
            onClick={() => setActiveSection('ideas')}
            className="group p-6 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-brand-500/40 cursor-pointer transition-all shadow-sm"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
              2. Brainstorm & Decide
            </h4>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              Share spontaneous idea cards, upvote concepts, and conduct quick team polls to make swift decisions.
            </p>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Explore Ideas & Polls <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Action 3: Plan on Kanban */}
          <div
            onClick={() => setActiveSection('projects')}
            className="group p-6 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-brand-500/40 cursor-pointer transition-all shadow-sm"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FolderKanban className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
              3. Plan & Complete
            </h4>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              Track work across 5 Kanban columns: Backlog, To Do, In Progress, Review, and Done.
            </p>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Open Kanban Board <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
