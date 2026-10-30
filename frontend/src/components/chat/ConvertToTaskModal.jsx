import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { apiRequest } from '../../api/client';
import { CheckSquare, X, ArrowRight, UserCheck, Calendar, Flag, FolderKanban, MessageSquareQuote } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Convert Message to Task</h2>
              <p className="text-xs text-slate-400">HomieLink Signature Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Source Message Preview */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
              <MessageSquareQuote className="h-3.5 w-3.5 text-brand-400" />
              <span>Original Message by @{message.sender.username}</span>
            </div>
            <p className="italic text-slate-300 line-clamp-3">"{message.content}"</p>
          </div>

          {/* Project selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <FolderKanban className="h-3.5 w-3.5 text-brand-400" />
              Target Project
            </label>
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Finish the frontend by Friday"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Description & Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          {/* Grid row: Priority and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Initial Column
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Grid row: Assignee and Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
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

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || projects.length === 0}
              className="px-4 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
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

