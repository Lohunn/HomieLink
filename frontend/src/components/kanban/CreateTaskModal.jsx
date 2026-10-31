import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { apiRequest } from '../../api/client';
import { Plus, X, Calendar, Flag, UserCheck, CheckSquare } from 'lucide-react';

export default function CreateTaskModal({ initialStatus = 'todo', onClose, onTaskCreated }) {
  const { activeProject, members } = useWorkspace();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeProject) {
      setError('Please select a project first.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        project: activeProject.id,
        title,
        description,
        status,
        priority,
        assignee_id: assigneeId ? parseInt(assigneeId, 10) : null,
        due_date: dueDate || null
      };

      const result = await apiRequest('/tasks/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (onTaskCreated) onTaskCreated(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-bg-sidebar border border-border-subtle rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-border-subtle flex items-center justify-between bg-bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-brand-primary/20 text-brand-primary flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Create New Task</h2>
              <p className="text-[11px] text-text-secondary">Add to {activeProject?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-status-error/10 border border-status-error/30 text-status-error text-xs">
              {error}
            </div>
          )}

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
              placeholder="e.g. Implement user authentication test suite"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
              placeholder="Add details, acceptance criteria, or links..."
            />
          </div>

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
                Column
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
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-brand-primary hover:bg-brand-hover text-white rounded-md shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5"
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
