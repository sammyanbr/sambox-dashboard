'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#000d1a] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-red-500/30 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-500">⚠️</span> Ocorreu um erro inesperado
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Desculpe, algo deu errado. Por favor, recarregue a página ou tente novamente mais tarde.
            </p>
            <div className="bg-black/50 p-4 rounded-xl border border-white/5 overflow-auto max-h-40 mb-6">
              <code className="text-xs text-red-400 font-mono">
                {this.state.error?.message}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
