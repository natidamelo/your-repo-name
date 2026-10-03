import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CalendarClock, 
  Users, 
  ShieldCheck, 
  CheckSquare, 
  Sliders, 
  Printer, 
  History, 
  LogOut, 
  Sparkles, 
  Layers, 
  ChevronRight,
  X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenGenerator: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  onOpenGenerator,
  isOpen = false,
  onClose 
}) => {
  const { user, role, logout, login } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
    { id: 'calendar', label: 'Calendar Roster', icon: CalendarDays, roles: ['admin', 'manager', 'staff'] },
    { id: 'daily', label: 'Daily Staff View', icon: CalendarClock, roles: ['admin', 'manager', 'staff'] },
    { id: 'coverage', label: 'Coverage Matrix', icon: Layers, roles: ['admin', 'manager', 'staff'] },
    { id: 'tasks', label: 'Task Assignments', icon: CheckSquare, roles: ['admin', 'manager'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['admin', 'manager'] },
    { id: 'audit', label: 'Audit Log', icon: History, roles: ['admin', 'manager'] },
    { id: 'settings', label: 'System Settings', icon: Sliders, roles: ['admin'] },
    { id: 'print', label: 'Print Schedule', icon: Printer, roles: ['admin', 'manager', 'staff'] },
  ];

  const filteredItems = menuItems.filter(item => !role || item.roles.includes(role));

  const handleTabClick = (id: string) => {
    onSelectTab(id);
    if (onClose) {
      onClose();
    }
  };

  const renderSidebarContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-4 border-b border-border/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/pwa-192x192.png" alt="App Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <div className="min-w-0">
            <h1 className="font-semibold text-foreground text-sm leading-tight tracking-tight truncate">
              Call Center OS
            </h1>
            <p className="text-[11px] text-muted-foreground font-normal">Scheduling & Management</p>
          </div>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Action Button */}
      {(role === 'admin' || role === 'manager') && (
        <div className="p-3">
          <button
            onClick={() => {
              onOpenGenerator();
              if (onClose) onClose();
            }}
            className="w-full h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Schedule</span>
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
            </button>
          );
        })}
      </nav>


      {/* User Info & Logout */}
      <div className="p-3 border-t border-border flex items-center justify-between bg-card/40">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-primary shrink-0">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : 'CC'}
          </div>
          <div className="truncate">
            <p className="text-xs font-medium text-foreground truncate">{user?.username || 'Authenticated'}</p>
            <span className="text-[10px] text-muted-foreground capitalize">
              {role || 'staff'}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary rounded-md transition"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="no-print hidden md:flex w-64 bg-card/60 backdrop-blur-md border-r border-border flex-col h-screen select-none shrink-0">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer (visible only on mobile when isOpen is true) */}
      {isOpen && (
        <div className="no-print fixed inset-0 z-50 md:hidden">
          {/* Dark Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />
          {/* Sliding Drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
