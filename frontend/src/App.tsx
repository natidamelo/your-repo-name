import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { DailyStaffPage } from './pages/DailyStaffPage';
import { CoveragePage } from './pages/CoveragePage';
import { TaskAssignmentsPage } from './pages/TaskAssignmentsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { PrintPage } from './pages/PrintPage';
import { LoginPage } from './pages/LoginPage';
import { ScheduleGeneratorModal } from './components/schedule/ScheduleGeneratorModal';
import { getSchedulesApi } from './api/client';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>('2026-09-28');
  const [activeSchedule, setActiveSchedule] = useState<any | null>(null);
  const [calendarDateRange, setCalendarDateRange] = useState<{
    startDate?: string;
    endDate?: string;
    label?: string;
  } | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchActiveSchedule = async () => {
    try {
      const list = await getSchedulesApi();
      if (list && list.length > 0) {
        setActiveSchedule(list[0]);
      }
    } catch (err) {
      console.error('Failed to load active schedule header:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveSchedule();
    }
  }, [isAuthenticated, refreshKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleSelectDateForDaily = (dateStr: string) => {
    setSelectedDailyDate(dateStr);
    setCurrentTab('daily');
  };

  const handleScheduleGenerated = (scheduleId: number) => {
    setRefreshKey(prev => prev + 1);
    setCurrentTab('calendar');
  };

  return (
    <MainLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onOpenGenerator={() => setIsGeneratorOpen(true)}
      activeScheduleName={activeSchedule ? activeSchedule.name : 'Sep 28 – Oct 11, 2026'}
      activeScheduleId={activeSchedule ? activeSchedule.id : 1}
      dateRange={currentTab === 'calendar' ? calendarDateRange : undefined}
      conflictsCount={0}
      onRefresh={() => setRefreshKey(prev => prev + 1)}
      onPrint={() => setCurrentTab('print')}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage
          onNavigateToCalendar={() => setCurrentTab('calendar')}
          onOpenGenerator={() => setIsGeneratorOpen(true)}
        />
      )}

      {currentTab === 'calendar' && (
        <CalendarPage
          key={refreshKey}
          onOpenGenerator={() => setIsGeneratorOpen(true)}
          onSelectDateForDailyView={handleSelectDateForDaily}
          onDateRangeChange={setCalendarDateRange}
          onScheduleChange={setActiveSchedule}
        />
      )}

      {currentTab === 'daily' && (
        <DailyStaffPage initialDate={selectedDailyDate} />
      )}

      {currentTab === 'coverage' && (
        <CoveragePage key={refreshKey} />
      )}

      {currentTab === 'tasks' && (
        <TaskAssignmentsPage key={refreshKey} />
      )}

      {currentTab === 'employees' && (
        <EmployeesPage />
      )}

      {currentTab === 'audit' && (
        <AuditLogPage key={refreshKey} />
      )}

      {currentTab === 'settings' && (
        <SettingsPage />
      )}

      {currentTab === 'print' && (
        <PrintPage onBack={() => setCurrentTab('dashboard')} />
      )}

      <ScheduleGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSuccess={handleScheduleGenerated}
      />
    </MainLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
