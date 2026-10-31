import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layers, ArrowRight, UserPlus } from 'lucide-react';

export default function RegisterView({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-bg-sidebar border border-border-subtle rounded-lg p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-brand-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Join HomieLink</h1>
            <p className="text-xs text-text-secondary">Your people. Your space. Your conversations.</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-md bg-status-error/10 border border-status-error/30 text-status-error text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-primary"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-primary"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-primary"
              placeholder="e.g. dev_jordan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-primary"
              placeholder="jordan@university.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-primary"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-brand-primary hover:bg-brand-hover text-white font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-brand-primary/25 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <UserPlus className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-secondary">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-brand-primary hover:underline font-semibold"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
