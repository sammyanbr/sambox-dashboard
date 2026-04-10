'use client';

import Dashboard from '@/components/Dashboard';
import Auth from '@/components/Auth';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Activity } from 'lucide-react';
import { auth } from '@/lib/firebase';

function AppContent() {
  const { user, status, loading } = useAuth();

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

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-[#000d1a] flex flex-col items-center justify-center p-4">
        <div className="bg-[#111111] border border-white/10 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Activity className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">Aguardando Aprovação</h2>
          <p className="text-gray-400 text-sm mb-6">
            Sua conta foi criada com sucesso, mas precisa ser aprovada por um administrador antes que você possa acessar o sistema.
          </p>
          <button 
            onClick={() => auth.signOut()}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#000d1a] flex flex-col items-center justify-center p-4">
        <div className="bg-[#111111] border border-white/10 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">Acesso Negado</h2>
          <p className="text-gray-400 text-sm mb-6">
            Sua solicitação de acesso foi recusada por um administrador.
          </p>
          <button 
            onClick={() => auth.signOut()}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            Sair
          </button>
        </div>
      </div>
    );
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
