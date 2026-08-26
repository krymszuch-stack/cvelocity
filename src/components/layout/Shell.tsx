import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileSidebar } from '../MobileSidebar';
import { NavSectionId, NavTabId } from '../../lib/navigation';
import { useAppStore } from '../../store/useAppStore';

export interface ShellProps {
  children: React.ReactNode;
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onOpenAdvisor: (initialQuestion?: string) => void;
  onOpenAuthModal: () => void;
  onOpenDesignTokens?: () => void;
  /** Sekcje odblokowane dla tego użytkownika (progresywne odsłanianie). */
  unlockedSections?: Partial<Record<NavSectionId, boolean>>;
  lockReasons?: Partial<Record<NavSectionId, string>>;
  isAuthenticated?: boolean;
  userEmail?: string;
  planStatus?: 'free' | 'trialing' | 'active';
}

export const Shell: React.FC<ShellProps> = ({
  children,
  activeTab,
  onSelectTab,
  onOpenAdvisor,
  onOpenAuthModal,
  onOpenDesignTokens,
  unlockedSections,
  lockReasons,
  isAuthenticated = false,
  userEmail,
  planStatus = 'free',
}) => {
  // Zwinięcie paska żyje w useAppStore z persystencją — wcześniej Shell trzymał
  // własny useState, a sklep miał martwe settery; preferencja ginęła co
  // odświeżenie strony.
  const { sidebarCollapsed: isSidebarCollapsed, toggleSidebar } = useAppStore();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectTab = (tab: NavTabId) => {
    onSelectTab(tab);
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="relative flex min-h-screen bg-surface font-sans text-ink">
      {/* Poświata otoczenia — patrz `.aurora-bg` w index.css */}
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>

      {/* Desktop Sticky Sidebar (16rem / 4rem) */}
      <aside
        className={`glass-rail sticky top-0 z-30 hidden h-screen shrink-0 transition-all duration-300 lg:block ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          onOpenAdvisor={() => onOpenAdvisor()}
          onOpenAuthModal={onOpenAuthModal}
          unlockedSections={unlockedSections}
          lockReasons={lockReasons}
          isAuthenticated={isAuthenticated}
          userEmail={userEmail}
          planStatus={planStatus}
        />
      </aside>

      {/* Mobile Drawer (MobileSidebar) */}
      <MobileSidebar
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        title="CVELOCITY"
      >
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isCollapsed={false}
          onToggleCollapse={() => {}}
          onOpenAdvisor={() => {
            setIsMobileDrawerOpen(false);
            onOpenAdvisor();
          }}
          onOpenAuthModal={() => {
            setIsMobileDrawerOpen(false);
            onOpenAuthModal();
          }}
          unlockedSections={unlockedSections}
          lockReasons={lockReasons}
          isAuthenticated={isAuthenticated}
          userEmail={userEmail}
          planStatus={planStatus}
        />
      </MobileSidebar>

      {/* Main Layout Column */}
      <div className="relative z-10 flex min-h-screen flex-1 flex-col overflow-x-hidden">
        {/* Topbar (56px) */}
        <Topbar
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          onOpenAdvisor={() => onOpenAdvisor()}
          onOpenAuthModal={onOpenAuthModal}
          onSelectTab={handleSelectTab}
          onOpenDesignTokens={onOpenDesignTokens}
          isAuthenticated={isAuthenticated}
          userEmail={userEmail}
        />

        {/* Content Area (p-6 lg:p-8, max-width 1440px) */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:p-8">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
};
