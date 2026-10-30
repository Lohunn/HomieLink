import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layers, ArrowRight, ShieldCheck, Sparkles, User, Users } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">HomieLink</h1>
            <p className="text-xs text-slate-400">One Space. Multiple Ways to Collaborate.</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="alex or alex@homielink.dev"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Quick Demo Accounts (1-Click Test)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('alex', 'password123')}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Alex
              </div>
              <div className="text-[10px] text-brand-400 font-medium">Owner</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('sam', 'password123')}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                Sam
              </div>
              <div className="text-[10px] text-indigo-400 font-medium">Admin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('taylor', 'password123')}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                Taylor
              </div>
              <div className="text-[10px] text-amber-400 font-medium">Member</div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-brand-400 hover:text-brand-300 font-medium underline underline-offset-4"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}

