import React, { useState } from 'react';
import { Cpu, ShieldCheck, Database, FileText, BarChart3, Settings, Zap, Key, User, LogIn, Lightbulb } from 'lucide-react';
import { TokenStats } from '../types';
import { useAuth } from '../context/AuthContext';

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
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                  SkillVault
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('matcher')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
                activeTab === 'matcher'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-cyan-300" />
              <span>Dopasuj Oferty</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
                activeTab === 'vault'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span>Baza CV</span>
              {vaultStatus.isLoaded && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('parser')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
                activeTab === 'parser'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Wczytaj Plik</span>
            </button>
          </nav>

          {/* Right Action Widgets: Advisor, Auth & Token Stats */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Gemini Advisor Lightbulb Button - Active in CV Edit mode ('vault') */}
            {onOpenAdvisor && activeTab === 'vault' && (
              <button
                onClick={() => onOpenAdvisor('Jak uzupełnić i wyedytować moje CV, by zdobyć najwyższy punkt doradczy ATS?')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-xs text-amber-300 transition-all active:scale-95 shadow-xs group"
                title="Doradca Edycji CV"
              >
                <Lightbulb className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold hidden sm:inline">Doradca CV 💡</span>
              </button>
            )}

            {/* User Profile / Auth Button */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs text-indigo-200 transition-all active:scale-95 shadow-xs"
              title={isAuthenticated ? 'Mój Profil' : 'Zaloguj się'}
            >
              {isAuthenticated && user ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-[10px]">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="font-semibold text-white text-xs truncate max-w-[100px]">
                      {user.fullName.split(' ')[0]}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-indigo-300" />
                  <span className="hidden sm:inline font-bold">Konto</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenTokenStats}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs text-slate-200 transition-all active:scale-95 shadow-xs"
              title="Statystyki Oszczędności Tokenów API"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-semibold text-emerald-400 text-xs hidden sm:inline">
                {tokenStats.totalTokensSaved.toLocaleString()} tk
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

