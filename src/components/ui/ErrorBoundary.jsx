import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('CampusSync Uncaught Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#04132a] text-[#d7e3ff] flex items-center justify-center p-6 selection:bg-[#71d8c8] selection:text-[#04132a]">
          <div className="max-w-lg w-full bg-[#112037]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-[#71d8c8]"></div>
            
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">emergency_home</span>
            </div>

            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              Unexpected Campus System Interruption
            </h1>
            <p className="font-sans text-sm text-[#d7e3ff]/80 mb-6 leading-relaxed">
              We encountered an unexpected error while loading this campus module. Your data is safe.
            </p>

            {this.state.error && (
              <div className="mb-6 text-left p-3.5 bg-black/40 border border-white/5 rounded-xl text-xs font-mono text-red-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-[#71d8c8] hover:bg-[#5bc2b2] text-[#04132a] text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Reload Module
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">home</span>
                Return to Campus
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
