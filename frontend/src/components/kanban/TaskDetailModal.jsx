import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import {
  X, CheckSquare, MessageSquareQuote, Calendar, Flag, UserCheck,
  FolderKanban, Send, MessageSquare, ArrowRight, Trash2, CheckCircle2, Sparkles
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog', color: 'bg-bg-surface text-text-secondary' },
  { value: 'todo', label: 'To Do', color: 'bg-brand-secondary/20 text-brand-secondary' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-brand-primary/20 text-brand-primary' },
  { value: 'review', label: 'Review', color: 'bg-amber-500/20 text-amber-300' },
  { value: 'done', label: 'Done', color: 'bg-status-online/20 text-status-online' },
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
    <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-bg-sidebar border border-border-subtle rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-border-subtle flex items-center justify-between bg-bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-brand-primary/20 text-brand-primary flex items-center justify-center">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {task.project_name || 'Project Task'}
              </span>
              <h2 className="text-sm font-bold text-text-primary">Task Details</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Progression Quick Buttons */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
              Status Progression
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-bg-main rounded-md border border-border-subtle">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatusChange(opt.value)}
                  className={`py-1.5 px-2 rounded text-xs font-semibold transition-all ${
                    status === opt.value
                      ? `${opt.color} shadow-sm border border-border-subtle font-bold`
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-hover/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* SIGNATURE FEATURE: SOURCE MESSAGE BACKLINK */}
          {task.source_message_details && (
            <div className="p-3.5 rounded-md bg-brand-500/10 border border-brand-primary/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-brand-primary">
                  <Sparkles className="h-4 w-4 text-brand-secondary" />
                  HomieLink Action Link
                </span>
                {task.source_message_details.channel_name && onJumpToChannel && (
                  <button
                    onClick={() => {
                      onJumpToChannel(task.source_message_details.channel);
                      onClose();
                    }}
                    className="text-[11px] text-brand-secondary hover:underline font-medium flex items-center gap-1"
                  >
                    View in #{task.source_message_details.channel_name}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-xs italic text-text-primary bg-bg-surface p-2.5 rounded border border-border-subtle">
                "{task.source_message_details.content}"
              </p>
              <div className="mt-1.5 text-[10px] text-text-muted">
                Converted from chat by{' '}
                <span className="text-text-primary font-medium">@{task.source_message_details.sender_name}</span>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-sm font-medium text-text-primary focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Metadata Controls */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
                <Flag className="h-3.5 w-3.5 text-amber-400" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-brand-secondary" /> Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
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
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Comments Feed */}
          <div className="pt-4 border-t border-border-subtle">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-brand-primary" />
              Activity & Comments ({comments.length})
            </h3>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {loadingComments ? (
                <div className="text-xs text-text-muted">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-text-muted italic">No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-md bg-bg-surface border border-border-subtle text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-text-primary">
                        {c.user.first_name ? `${c.user.first_name} ${c.user.last_name || ''}` : c.user.username}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-text-secondary">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3.5 py-2 rounded-md bg-brand-primary hover:bg-brand-hover disabled:opacity-30 text-white text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Comment
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-border-subtle bg-bg-surface/50 flex items-center justify-between">
          <div className="text-[11px] text-text-muted">
            Created by @{task.created_by?.username || 'team'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-hover transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold bg-brand-primary hover:bg-brand-hover text-white rounded-md shadow-md shadow-brand-primary/20 transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
