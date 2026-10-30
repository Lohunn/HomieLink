import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import {
  X, CheckSquare, MessageSquareQuote, Calendar, Flag, UserCheck,
  FolderKanban, Send, MessageSquare, ArrowRight, Trash2, CheckCircle2
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog', color: 'bg-slate-700' },
  { value: 'todo', label: 'To Do', color: 'bg-sky-600' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-600' },
  { value: 'review', label: 'Review', color: 'bg-indigo-600' },
  { value: 'done', label: 'Done', color: 'bg-emerald-600' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-slate-400 bg-slate-800' },
  { value: 'medium', label: 'Medium', color: 'text-blue-400 bg-blue-950/40' },
  { value: 'high', label: 'High', color: 'text-amber-400 bg-amber-950/40' },
  { value: 'urgent', label: 'Urgent', color: 'text-rose-400 bg-rose-950/40' },
];

export default function TaskDetailModal({ task, onClose, onTaskUpdated, onJumpToChannel }) {
  const { members, activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assignee ? task.assignee.id : '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load comments
  useEffect(() => {
    apiRequest(`/tasks/${task.id}/comments/`)
      .then((data) => {
        setComments(data);
        setLoadingComments(false);
      })
      .catch((err) => {
        console.error("Failed to load task comments", err);
        setLoadingComments(false);
      });
  }, [task.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiRequest(`/tasks/${task.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          assignee_id: assigneeId ? parseInt(assigneeId, 10) : null,
          due_date: dueDate || null
        })
      });
      if (onTaskUpdated) onTaskUpdated(updated);
      onClose();
    } catch (err) {
      console.error("Failed to update task", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const content = newComment.trim();
    setNewComment('');

    try {
      const created = await apiRequest(`/tasks/${task.id}/comments/`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      setComments((prev) => [...prev, created]);
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      const updated = await apiRequest(`/tasks/${task.id}/update_status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {task.project_name || 'Project Task'}
              </span>
              <h2 className="text-sm font-bold text-white">Task Details</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Progression Quick Buttons */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Workflow Status
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950/50 rounded-xl border border-slate-800">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatusChange(opt.value)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    status === opt.value
                      ? `${opt.color} text-white shadow-md`
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* SIGNATURE FEATURE: SOURCE MESSAGE BACKLINK */}
          {task.source_message_details && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-950/40 to-slate-900 border border-brand-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                  <MessageSquareQuote className="h-4 w-4 text-brand-400" />
                  HomieLink Action Link
                </span>
                {task.source_message_details.channel_name && onJumpToChannel && (
                  <button
                    onClick={() => onJumpToChannel(task.source_message_details.channel)}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 underline underline-offset-2"
                  >
                    View in #{task.source_message_details.channel_name}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-xs italic text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                "{task.source_message_details.content}"
              </p>
              <div className="mt-1.5 text-[10px] text-slate-400">
                Converted from chat by{' '}
                <span className="text-slate-200 font-medium">@{task.source_message_details.sender_name}</span>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Metadata Controls */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Flag className="h-3.5 w-3.5 text-amber-400" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-indigo-400" /> Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.first_name ? `${m.user.first_name} (${m.user.username})` : m.user.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Comments section */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              Activity & Comments ({comments.length})
            </h3>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {loadingComments ? (
                <div className="text-xs text-slate-500">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-slate-500 italic">No comments yet. Start the discussion!</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">
                        {c.user.first_name ? `${c.user.first_name} ${c.user.last_name || ''}` : c.user.username}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment or update..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Comment
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-800/30 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Created by @{task.created_by?.username || 'team'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

