import React, { useState, useEffect } from 'react';
import { History, Shield, Clock, FileText, User, RotateCw } from 'lucide-react';
import { getAuditLogsApi } from '../api/client';
import { AuditLogItem } from '../types';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogsApi();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Schedule Audit & Compliance Trail</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Chronological record of manual overrides, shift swaps, and schedule engine runs</p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="h-9 px-3.5 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium flex items-center space-x-2 border border-border transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px] rounded-xl bg-card border border-border">
          <RotateCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border text-sm">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4 w-44">Timestamp</th>
                  <th className="py-3 px-4 w-36">Author</th>
                  <th className="py-3 px-4 w-32">Action</th>
                  <th className="py-3 px-4">Modification Details</th>
                  <th className="py-3 px-4 w-52">Mandatory Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {logs.map((log) => {
                  const dt = new Date(log.date_time);
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {dt.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-medium text-foreground">
                        <span className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-primary" />
                          <span>{log.user_name}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-medium text-[10px] bg-secondary text-secondary-foreground border border-border">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-foreground space-y-0.5">
                        {log.old_value && (
                          <div className="text-muted-foreground line-through">
                            {log.old_value}
                          </div>
                        )}
                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {log.new_value}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground italic">
                        {log.reason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
