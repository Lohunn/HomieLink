import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Hash, X, Plus, Lock } from 'lucide-react';

export default function CreateChannelModal({ onClose }) {
  const { createChannel } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSubmitting(true);

    try {
      await createChannel(name.trim(), description.trim(), isPrivate);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create channel');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-sidebar border border-border-subtle rounded-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-brand-primary" />
            <h3 className="text-sm font-bold text-text-primary">Create Channel</h3>
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
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-text-muted text-xs font-mono">#</span>
              <input
                type="text"
                required
                placeholder="e.g. design-feedback"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded-md pl-7 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Topic / Purpose (optional)
            </label>
            <textarea
              rows={2}
              placeholder="What will your team discuss in this channel?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded bg-bg-surface border-border-subtle text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor="isPrivate" className="text-xs text-text-secondary flex items-center gap-1 cursor-pointer">
              <Lock className="h-3 w-3 text-text-muted" />
              Make channel private
            </label>
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
              {submitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
