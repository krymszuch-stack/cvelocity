import React from 'react';
import { Shield, Database, FileText, BarChart3, Zap, LogIn, Lock } from 'lucide-react';
import { TokenStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { AdvisorButton } from './ui/AdvisorButton';

interface HeaderProps {
  activeTab: 'matcher' | 'vault' | 'parser' | 'profiler';
  setActiveTab: (tab: 'matcher' | 'vault' | 'parser' | 'profiler') => void;
  tokenStats: TokenStats;
  vaultStatus: { isLoaded: boolean; itemCount: number; isEncrypted: boolean };
  onOpenTokenStats: () => void;
  onOpenAuthModal: () => void;
  onOpenAdvisor?: (question?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  tokenStats,
  vaultStatus,
  onOpenTokenStats,
  onOpenAuthModal,
  onOpenAdvisor,
}) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-brand-950/60 text-slate-100 sticky top-0 z-40 shadow-xl shadow-brand-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand - Bank/Fintech Aesthetic */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('matcher')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-0.5 shadow-lg shadow-brand-900/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
                  CVelocity
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-950/80 text-brand-400 border border-brand-800/50 hidden sm:inline-block">
                  Fintech Grade
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('matcher')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
                activeTab === 'matcher'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 ring-1 ring-brand-400/40'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-brand-300'
              }`}
            >
              <Zap className="w-4 h-4 text-brand-300" />
              <span>Dopasuj Oferty</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
                activeTab === 'vault'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 ring-1 ring-brand-400/40'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-brand-300'
              }`}
            >
              <Database className="w-4 h-4 text-brand-300" />
              <span>Baza CV</span>
              {vaultStatus.isLoaded && (
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" title="Szyfrowany Vault Aktywny"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('parser')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
                activeTab === 'parser'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 ring-1 ring-brand-400/40'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-brand-300'
              }`}
            >
              <FileText className="w-4 h-4 text-brand-400" />
              <span>Wczytaj Plik</span>
            </button>
          </nav>

          {/* Right Action Widgets */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Gemini Advisor Button */}
            {onOpenAdvisor && activeTab === 'vault' && (
              <AdvisorButton
                onClick={() => onOpenAdvisor('Jak uzupełnić i wyedytować moje CV, by zdobyć najwyższy punkt doradczy ATS?')}
                title="Doradca Edycji CV AI"
              />
            )}

            {/* User Profile / Auth Button */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-brand-900/60 text-xs text-slate-200 transition-all active:scale-95 shadow-xs"
              title={isAuthenticated ? 'Mój Profil & Bezpieczeństwo' : 'Zaloguj się do Vaulta'}
            >
              {isAuthenticated && user ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="font-semibold text-white text-xs truncate max-w-[100px]">
                      {user.fullName.split(' ')[0]}
                    </div>
                  </div>
                  <Lock className="w-3 h-3 text-brand-400 hidden sm:inline" />
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-brand-400" />
                  <span className="hidden sm:inline font-bold">Konto</span>
                </>
              )}
            </button>

            {/* Token Stats Widget */}
            <button
              onClick={onOpenTokenStats}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-brand-900/60 text-xs text-slate-200 transition-all active:scale-95 shadow-xs"
              title="Statystyki Oszczędności Tokenów API"
            >
              <BarChart3 className="w-4 h-4 text-brand-400" />
              <span className="font-mono font-semibold text-brand-400 text-xs hidden sm:inline">
                {tokenStats.totalTokensSaved.toLocaleString()} tk
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
