import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { apiRequest } from '../../api/client';
import {
  Activity, CheckSquare, MessageSquare, Lightbulb, Users,
  FolderKanban, Sparkles, CheckCircle2
} from 'lucide-react';

export default function ActivityFeedView() {
  const { activeWorkspace } = useWorkspace();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);

    apiRequest(`/activities/?workspace_id=${activeWorkspace.id}`)
      .then((data) => {
        setActivities(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load activities", err);
        setLoading(false);
      });
  }, [activeWorkspace]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'message_converted':
        return <Sparkles className="h-4 w-4 text-brand-400" />;
      case 'task_completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'task_created':
      case 'task_updated':
        return <CheckSquare className="h-4 w-4 text-indigo-400" />;
      case 'idea_created':
        return <Lightbulb className="h-4 w-4 text-amber-400" />;
      case 'member_joined':
        return <Users className="h-4 w-4 text-sky-400" />;
      case 'project_created':
        return <FolderKanban className="h-4 w-4 text-purple-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white">Workspace Activity Log</h2>
        </div>
        <span className="text-xs text-slate-400">Real-time audit trail</span>
      </div>

      {/* Stream */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Activity className="h-10 w-10 mx-auto text-slate-700 mb-2" />
            <p className="text-sm font-medium">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-4 group">
                {/* Node icon */}
                <div className="absolute -left-6 mt-0.5 h-6 w-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-sm">
                  {getEventIcon(act.event_type)}
                </div>

                <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">
                      @{act.actor?.username || 'user'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(act.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
