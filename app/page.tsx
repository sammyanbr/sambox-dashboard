'use client';

import Dashboard from '@/components/Dashboard';
import Auth from '@/components/Auth';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Activity } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000d1a] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center animate-pulse mb-4">
          <Activity className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <p className="text-blue-500 font-black uppercase tracking-widest text-sm animate-pulse">
          Carregando...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <Dashboard />;
}

export default function Home() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
