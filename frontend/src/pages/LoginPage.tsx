import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { loginApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const res = await loginApi(formData);
      await login(res.access_token, res.role, res.username);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoUser = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md font-bold text-lg mx-auto">
            CC
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Call Center Scheduling</h1>
          <p className="text-xs text-muted-foreground">Sign in to manage employee shifts, rotations & coverage</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive-foreground text-xs text-center font-medium">
            {error}
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3.5 h-10 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 h-10 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-sm flex items-center justify-center space-x-2 transition active:scale-95 disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Roles Quick Pick */}
        <div className="pt-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground font-medium text-center mb-2.5">Quick Demo Roles:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoUser('admin', 'admin123')}
              className="h-8 px-2 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border text-xs font-medium transition text-center"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('manager', 'manager123')}
              className="h-8 px-2 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border text-xs font-medium transition text-center"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('staff', 'staff123')}
              className="h-8 px-2 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground border border-border text-xs font-medium transition text-center"
            >
              Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
