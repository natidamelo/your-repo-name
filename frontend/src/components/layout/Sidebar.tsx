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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenGenerator: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenGenerator }) => {
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

  return (
    <aside className="no-print w-64 bg-card/60 backdrop-blur-md border-r border-border flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-border/80 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm text-primary-foreground font-bold text-sm tracking-tighter">
          CC
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-foreground text-sm leading-tight tracking-tight truncate">
            Call Center OS
          </h1>
          <p className="text-[11px] text-muted-foreground font-normal">Scheduling & Management</p>
        </div>
      </div>

      {/* Quick Action Button - Shadcn Primary style */}
      {(role === 'admin' || role === 'manager') && (
        <div className="p-3">
          <button
            onClick={onOpenGenerator}
            className="w-full h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Schedule</span>
          </button>
        </div>
      )}

      {/* Navigation Links - Shadcn Ghost Nav style */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-secondary text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3 h-3 text-muted-foreground/60" />}
            </button>
          );
        })}
      </nav>

      {/* Role Switcher Demo Bar */}
      <div className="p-3 bg-muted/40 border-t border-border/60">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Role Preview</span>
          <span className="text-[10px] font-mono text-primary uppercase">{role}</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => login('mock_admin_token', 'admin', 'admin')}
            className={`px-2 py-1 text-[11px] rounded-md font-medium text-center transition ${
              role === 'admin'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => login('mock_manager_token', 'manager', 'manager')}
            className={`px-2 py-1 text-[11px] rounded-md font-medium text-center transition ${
              role === 'manager'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            Manager
          </button>
          <button
            onClick={() => login('mock_staff_token', 'staff', 'staff')}
            className={`px-2 py-1 text-[11px] rounded-md font-medium text-center transition ${
              role === 'staff'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            Staff
          </button>
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-border flex items-center justify-between bg-card/40">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-primary">
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
    </aside>
  );
};
