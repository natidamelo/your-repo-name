import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { loginApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { InstallAppButton } from '../components/layout/InstallAppButton';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setTimeout(() => {
        setIsWakingUp(true);
      }, 2500);
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      // Clean and normalize username to avoid mobile keyboard auto-capitalization errors
      formData.append('username', username.trim().toLowerCase());
      formData.append('password', password);

      const res = await loginApi(formData);
      await login(res.access_token, res.role, res.username);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <img
            src="/pwa-192x192.png"
            alt="Call Center Logo"
            className="w-16 h-16 rounded-2xl shadow-xl mx-auto ring-2 ring-sky-500/30 active:scale-95 transition"
          />
          <h1 className="text-xl font-bold text-foreground tracking-tight">Call Center Scheduling</h1>
          <p className="text-xs text-muted-foreground">Sign in to manage employee shifts, rotations & coverage</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive-foreground text-xs text-center font-medium flex items-center justify-center space-x-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        )}

        {/* Cold-start notification */}
        {isWakingUp && (
          <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs text-center font-medium animate-pulse">
            Connecting to cloud server... (Render free tier wakes up in ~15-30s)
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                placeholder="e.g. admin, manager, or staff"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3.5 h-10 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center space-x-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 h-10 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-sm flex items-center justify-center space-x-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Credentials / Demo Roles (Helpful on mobile keyboards) */}
        <div className="pt-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground font-medium text-center mb-2">
            Quick Fill (Default Credentials):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin', 'admin123')}
              className="py-1.5 px-2 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border text-xs font-semibold transition text-center cursor-pointer"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('manager', 'manager123')}
              className="py-1.5 px-2 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border text-xs font-semibold transition text-center cursor-pointer"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('staff', 'staff123')}
              className="py-1.5 px-2 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border text-xs font-semibold transition text-center cursor-pointer"
            >
              Staff
            </button>
          </div>
        </div>

        {/* Mobile Install App Button */}
        <div className="flex justify-center pt-2 border-t border-border/60">
          <InstallAppButton />
        </div>
      </div>
    </div>
  );
};
