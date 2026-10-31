import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Layers, X, Plus } from 'lucide-react';

export default function CreateWorkspaceModal({ onClose }) {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSubmitting(true);

    try {
      await createWorkspace(name.trim(), description.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-sidebar border border-border-subtle rounded-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand-primary" />
            <h3 className="text-sm font-bold text-text-primary">Create Workspace</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-status-error/10 border border-status-error/30 text-status-error text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Autonomous Drone Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Description & Mission
            </label>
            <textarea
              rows={3}
              placeholder="What is your team building or collaborating on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-brand-primary hover:bg-brand-hover text-white rounded-md shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
