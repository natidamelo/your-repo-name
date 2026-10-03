import React, { useState, useEffect } from 'react';
import { Printer, Download, ArrowLeft, RotateCw } from 'lucide-react';
import { getSchedulesApi, getScheduleApi } from '../api/client';
import { SchedulePeriod } from '../types';

interface PrintPageProps {
  onBack: () => void;
}

export const PrintPage: React.FC<PrintPageProps> = ({ onBack }) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<SchedulePeriod | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await getSchedulesApi();
        setSchedules(list);
        if (list.length > 0) {
          setActiveScheduleId(list[0].id);
          const detail = await getScheduleApi(list[0].id);
          setSchedule(detail);
        }
      } catch (err) {
        console.error('Failed to load for print:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Group shifts by employee
  const empShiftsMap: { [name: string]: { [date: string]: string } } = {};
  if (schedule && schedule.days) {
    schedule.days.forEach(day => {
      day.shifts.forEach(s => {
        if (!empShiftsMap[s.employee_name]) {
          empShiftsMap[s.employee_name] = {};
        }
        empShiftsMap[s.employee_name][day.date] = s.shift_type;
      });
    });
  }

  const staffNames = Object.keys(empShiftsMap).sort();
  const sortedDays = schedule?.days ? [...schedule.days].sort((a, b) => a.date.localeCompare(b.date)) : [];

  return (
    <div className="space-y-6">
      {/* Action Controls - Hidden when Printing */}
      <div className="no-print flex items-center justify-between p-5 rounded-xl bg-card border border-border shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 h-9 px-3.5 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium border border-border transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-sm transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Notice</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px] rounded-xl bg-card border border-border">
          <RotateCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        /* Printable Notice Container */
        <div className="bg-white text-black p-8 rounded-xl shadow-lg print:shadow-none print:p-0 print:m-0 font-sans print-page">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider text-black">
                CALL CENTER OPERATIONS
              </h1>
              <h2 className="text-lg font-bold text-gray-800">
                Official Staff Scheduling Roster
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Schedule Period: <strong>{schedule?.start_date} to {schedule?.end_date}</strong> (14 Days)
              </p>
            </div>
            <div className="text-right text-xs text-gray-600 space-y-1">
              <p>Status: <span className="font-bold uppercase text-black">{schedule?.status}</span></p>
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>Notice Ref: CC-ROSTER-{schedule?.id || 1}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left font-bold text-black w-28">
                    Employee
                  </th>
                  {sortedDays.map(day => {
                    const d = new Date(day.date + 'T00:00:00');
                    return (
                      <th key={day.date} className="border border-gray-400 p-1.5 text-center font-bold text-black">
                        <div>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                        <div className="text-[10px] text-gray-600">{d.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {staffNames.map(name => (
                  <tr key={name} className="hover:bg-gray-50">
                    <td className="border border-gray-400 p-1.5 font-bold text-black whitespace-nowrap">
                      {name}
                    </td>
                    {sortedDays.map(day => {
                      const st = empShiftsMap[name]?.[day.date] || 'OFF';
                      let bg = 'bg-white';
                      let text = st;
                      if (st === 'WORK') {
                        bg = 'bg-emerald-50 text-emerald-900 font-semibold';
                      } else if (st === 'OFF') {
                        bg = 'bg-gray-100 text-gray-500';
                      } else if (st === 'AM_HALF') {
                        bg = 'bg-amber-50 text-amber-900 font-bold';
                        text = 'AM';
                      } else if (st === 'PM_HALF') {
                        bg = 'bg-purple-50 text-purple-900 font-bold';
                        text = 'PM';
                      } else if (st === 'SUNDAY_DUTY') {
                        bg = 'bg-indigo-50 text-indigo-900 font-black';
                        text = 'SUN';
                      }

                      return (
                        <td
                          key={day.date}
                          className={`border border-gray-400 p-1 text-center text-[10px] ${bg}`}
                        >
                          {text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Operational Rules Notes */}
          <div className="text-[10px] text-gray-600 border border-gray-300 p-3 rounded mb-6 space-y-1">
            <p className="font-bold text-black uppercase">Standard Operating Shift Guidelines:</p>
            <p>1. Saturday rotation: Hebron and Beti alternate AM Half (08:00/09:00 - 12:00/14:00) and PM Half (13:00/14:00 - 17:00/18:00).</p>
            <p>2. Sunday squad is limited to exactly 4 staff. Sunday duty staff receives compensatory Monday OFF.</p>
            <p>3. Lunch breaks must be strictly observed with Yeab, Feruza, Yordi, and Hermela maintaining continuous call center coverage.</p>
          </div>

          {/* Signatures Footer */}
          <div className="pt-6 border-t border-gray-400 grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="text-gray-500">Call Center Operations Manager:</p>
              <div className="h-10 border-b border-gray-400 w-48 mt-2"></div>
              <p className="text-[10px] text-gray-400 mt-1">Signature & Date</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Department Director Approval:</p>
              <div className="h-10 border-b border-gray-400 w-48 ml-auto mt-2"></div>
              <p className="text-[10px] text-gray-400 mt-1">Signature & Date</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
