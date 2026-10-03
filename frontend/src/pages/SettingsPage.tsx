import React, { useState, useEffect } from 'react';
import { Sliders, Save, Check, RotateCw, Sun, Moon, Palette, Users, Shield } from 'lucide-react';
import { getSettingsApi, updateSettingApi } from '../api/client';
import { SystemSetting } from '../types';
import { useTheme } from '../context/ThemeContext';
import { UserManagementSection } from '../components/settings/UserManagementSection';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'appearance'>('users');
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getSettingsApi();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev =>
      prev.map(s => (s.key === key ? { ...s, value } : s))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      for (const s of settings) {
        await updateSettingApi(s.key, s.value);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-3.5 p-5 rounded-xl bg-card border border-border shadow-sm">
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">System & Interface Configuration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Control staff & manager accounts, change passwords, and configure scheduling parameters</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
            activeTab === 'users'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff & Manager Accounts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
            activeTab === 'rules'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Scheduling Parameters</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
            activeTab === 'appearance'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Appearance</span>
        </button>
      </div>

      {/* Tab 1: Staff & Manager Accounts & Passwords */}
      {activeTab === 'users' && (
        <UserManagementSection />
      )}

      {/* Tab 2: Scheduling Parameters */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {savedSuccess && (
            <div className="p-3.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Settings saved and applied to scheduling engine successfully.</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px] rounded-xl bg-card border border-border">
              <RotateCw className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="p-6 rounded-xl bg-card border border-border space-y-6 shadow-sm">
              <div className="divide-y divide-border/60">
                {settings.map(s => (
                  <div key={s.id} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-foreground block uppercase tracking-wider">
                        {s.key.replace(/_/g, ' ')}
                      </label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={s.value}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-background border border-input text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs flex items-center space-x-2 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: Appearance */}
      {activeTab === 'appearance' && (
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Interface Theme Appearance</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose your preferred display mode. You can also toggle quickly using the sun/moon icon in the top header.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex items-center space-x-3 transition text-left ${
                theme === 'light'
                  ? 'border-primary ring-2 ring-primary/20 bg-accent text-accent-foreground shadow-sm'
                  : 'border-border bg-card hover:bg-accent/50 text-foreground'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold">Light Mode</div>
                <div className="text-[11px] text-muted-foreground">Crisp clean white background with high-contrast text</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex items-center space-x-3 transition text-left ${
                theme === 'dark'
                  ? 'border-primary ring-2 ring-primary/20 bg-accent text-accent-foreground shadow-sm'
                  : 'border-border bg-card hover:bg-accent/50 text-foreground'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold">Dark Mode</div>
                <div className="text-[11px] text-muted-foreground">Sleek dark zinc palette, easy on eyes for low-light environments</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
