import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar, DateRangeInfo } from './Topbar';

interface MainLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenGenerator: () => void;
  activeScheduleName?: string;
  activeScheduleId?: number;
  dateRange?: DateRangeInfo;
  conflictsCount?: number;
  onRefresh?: () => void;
  onPrint?: () => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenGenerator,
  activeScheduleName,
  activeScheduleId,
  dateRange,
  conflictsCount,
  onRefresh,
  onPrint,
  children
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onOpenGenerator={onOpenGenerator}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          activeScheduleName={activeScheduleName}
          activeScheduleId={activeScheduleId}
          dateRange={dateRange}
          conflictsCount={conflictsCount}
          onRefresh={onRefresh}
          onPrint={onPrint}
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
