import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layers, ArrowRight, Sparkles, User, Users, Shield } from 'lucide-react';

export default function LoginView({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setLoading(true);
    try {
      await login(user, pass);
    } catch (err) {
      setError(err.message || 'Login failed');
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
            <h1 className="text-xl font-bold tracking-tight text-text-primary">HomieLink</h1>
            <p className="text-xs text-text-secondary">Your people. Your space. Your conversations.</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-md bg-status-error/10 border border-status-error/30 text-status-error text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-primary transition-all"
              placeholder="alex or alex@homielink.dev"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3.5 py-2.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-primary transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-brand-primary hover:bg-brand-hover text-white font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-brand-primary/25 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-secondary" />
            Quick Demo Accounts (1-Click Test)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('alex', 'password123')}
              className="p-2.5 rounded-md bg-bg-surface hover:bg-bg-hover border border-border-subtle text-left transition-all"
            >
              <div className="text-xs font-bold text-text-primary flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-status-online" />
                Alex
              </div>
              <div className="text-[10px] text-amber-400 font-semibold">Owner</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('sam', 'password123')}
              className="p-2.5 rounded-md bg-bg-surface hover:bg-bg-hover border border-border-subtle text-left transition-all"
            >
              <div className="text-xs font-bold text-text-primary flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                Sam
              </div>
              <div className="text-[10px] text-brand-secondary font-semibold">Admin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('taylor', 'password123')}
              className="p-2.5 rounded-md bg-bg-surface hover:bg-bg-hover border border-border-subtle text-left transition-all"
            >
              <div className="text-xs font-bold text-text-primary flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                Taylor
              </div>
              <div className="text-[10px] text-brand-primary font-semibold">Member</div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-text-secondary">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-brand-primary hover:underline font-semibold"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
