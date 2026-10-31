import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { apiRequest } from '../../api/client';
import {
  CheckSquare, X, ArrowRight, UserCheck, Calendar, Flag,
  FolderKanban, MessageSquareQuote, Sparkles
} from 'lucide-react';

export default function ConvertToTaskModal({ message, onClose, onSuccess }) {
  const { projects, members, activeProject } = useWorkspace();

  const [projectId, setProjectId] = useState(activeProject ? activeProject.id : (projects[0]?.id || ''));
  const [title, setTitle] = useState(
    message.content.length > 60 ? message.content.substring(0, 60) + '...' : message.content
  );
  const [description, setDescription] = useState(
    `Converted from message by @${message.sender.username} in #${message.channel ? message.channel : 'chat'}:\n\n"${message.content}"`
  );
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select or create a project first.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        project_id: parseInt(projectId, 10),
        title,
        description,
        priority,
        status,
        assignee_id: assigneeId ? parseInt(assigneeId, 10) : null,
        due_date: dueDate || null
      };

      const result = await apiRequest(`/messages/${message.id}/convert_to_task/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to convert message to task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-bg-sidebar border border-border-subtle rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-border-subtle flex items-center justify-between bg-bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-brand-primary/20 text-brand-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Convert Message to Task</h2>
              <p className="text-[11px] text-text-secondary">HomieLink Signature Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-md bg-status-error/10 border border-status-error/30 text-status-error text-xs">
              {error}
            </div>
          )}

          {/* Source Message Preview */}
          <div className="p-3 rounded-md bg-bg-surface border border-border-subtle text-xs text-text-secondary">
            <div className="flex items-center gap-1.5 text-text-muted font-medium mb-1">
              <MessageSquareQuote className="h-3.5 w-3.5 text-brand-primary" />
              <span>Original Message by @{message.sender.username}</span>
            </div>
            <p className="italic text-text-primary line-clamp-3">"{message.content}"</p>
          </div>

          {/* Project selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5">
              <FolderKanban className="h-3.5 w-3.5 text-brand-primary" />
              Target Project
            </label>
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            >
              {projects.length === 0 ? (
                <option value="">No projects available (Create one first)</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
              placeholder="e.g. Finish the frontend by Friday"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Description & Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary font-mono"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Initial Column
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
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

          {/* Footer buttons */}
          <div className="pt-3 border-t border-border-subtle flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || projects.length === 0}
              className="px-4 py-2 text-xs font-semibold bg-brand-primary hover:bg-brand-hover text-white rounded-md shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? 'Converting...' : 'Convert to Task & Pin'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
