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
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-brand-400" />
            <h3 className="text-base font-bold text-white">Create Channel</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">#</span>
              <input
                type="text"
                required
                placeholder="e.g. design-feedback"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Topic / Purpose (optional)
            </label>
            <textarea
              rows={2}
              placeholder="What will your team discuss in this channel?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="isPrivate" className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer">
              <Lock className="h-3 w-3 text-slate-400" />
              Make channel private
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
