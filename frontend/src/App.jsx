import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import LoginView from './components/auth/LoginView';
import RegisterView from './components/auth/RegisterView';
import AppLayout from './components/layout/AppLayout';
import { Layers } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 animate-pulse">
          <Layers className="h-6 w-6" />
        </div>
        <p className="text-xs font-medium tracking-wider uppercase text-slate-500">
          Loading HomieLink...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode === 'register') {
      return <RegisterView onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <LoginView onSwitchToRegister={() => setAuthMode('register')} />;
  }

  return (
    <WorkspaceProvider>
      <AppLayout />
    </WorkspaceProvider>
  );
}

