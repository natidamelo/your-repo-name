import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Coffee, 
  Clock, 
  Check, 
  X, 
  RotateCw
} from 'lucide-react';
import { getEmployeesApi, updateEmployeeApi, createEmployeeApi, getSkillsApi } from '../api/client';
import { Employee, Skill } from '../types';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [position, setPosition] = useState<string>('Call Center Agent');
  const [lunchStart, setLunchStart] = useState<string>('12:00');
  const [lunchEnd, setLunchEnd] = useState<string>('13:00');
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchEmployeesAndSkills = async () => {
    setIsLoading(true);
    try {
      const [emps, sks] = await Promise.all([
        getEmployeesApi(),
        getSkillsApi()
      ]);
      setEmployees(emps);
      setSkillsList(sks);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesAndSkills();
  }, []);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFirstName('');
    setLastName('');
    setPosition('Call Center Agent');
    setLunchStart('12:00');
    setLunchEnd('13:00');
    setSelectedSkillIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFirstName(emp.first_name);
    setLastName(emp.last_name || '');
    setPosition(emp.position);
    setLunchStart(emp.lunch_break?.start_time || '12:00');
    setLunchEnd(emp.lunch_break?.end_time || '13:00');
    setSelectedSkillIds(emp.skills.map(s => s.skill_id));
    setIsModalOpen(true);
  };

  const toggleSkill = (id: number) => {
    setSelectedSkillIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingEmployee) {
        await updateEmployeeApi(editingEmployee.id, {
          first_name: firstName,
          last_name: lastName,
          position,
          lunch_start: lunchStart,
          lunch_end: lunchEnd,
          skill_ids: selectedSkillIds
        });
      } else {
        await createEmployeeApi({
          first_name: firstName,
          last_name: lastName,
          position,
          lunch_start: lunchStart,
          lunch_end: lunchEnd,
          skill_ids: selectedSkillIds
        });
      }
      setIsModalOpen(false);
      fetchEmployeesAndSkills();
    } catch (err: any) {
      alert(err.message || 'Failed to save employee profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-secondary text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Staff Management & Skill Profiles</h2>
            <p className="text-xs text-muted-foreground">12 core call center employees with custom hours, lunches, and constraint rules</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-xs inline-flex items-center space-x-1.5 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RotateCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => {
            const isLead = emp.first_name === 'Hebron' || emp.first_name === 'Beti';
            const isSundayRestricted = emp.first_name === 'Yordi' || emp.first_name === 'Obsa';
            const isCoverageLead = emp.first_name === 'Yeab';

            return (
              <div
                key={emp.id}
                className="p-5 rounded-xl border border-border bg-card shadow-xs hover:border-border/80 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${isLead ? 'bg-primary ring-2 ring-primary/20' : 'bg-emerald-400'}`} />
                        <h3 className="font-bold text-base text-foreground">{emp.full_name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.position}</p>
                    </div>
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition"
                      title="Edit Profile"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges for Special Rules */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {isLead && (
                      <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-800/40 dark:bg-sky-950/30 dark:text-sky-300 px-2 py-0.5 text-[10px] font-semibold">
                        Rotation Lead
                      </span>
                    )}
                    {isSundayRestricted && (
                      <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 text-rose-800 dark:border-destructive/40 dark:bg-destructive/20 dark:text-destructive px-2 py-0.5 text-[10px] font-semibold">
                        Sunday OFF
                      </span>
                    )}
                    {isCoverageLead && (
                      <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-800/40 dark:bg-indigo-950/30 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-semibold">
                        Covers Beti
                      </span>
                    )}
                  </div>

                  {/* Hours & Lunch */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-muted-foreground p-3 rounded-lg border border-border bg-secondary/40">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Hours:</span>
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {emp.working_hours?.[0] ? `${emp.working_hours[0].start_time} - ${emp.working_hours[0].end_time}` : '08:00 - 17:00'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5 font-medium">
                        <Coffee className="w-3.5 h-3.5 text-amber-500" />
                        <span>Lunch:</span>
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {emp.lunch_break ? `${emp.lunch_break.start_time} - ${emp.lunch_break.end_time}` : '12:00 - 13:00'}
                      </span>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1.5">
                      Skills ({emp.skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {emp.skills.map(s => (
                        <span
                          key={s.id}
                          className="inline-flex items-center rounded-md border border-border bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                        >
                          {s.skill_name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                {editingEmployee ? `Edit ${editingEmployee.full_name}` : 'Add New Employee'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Position Title</label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Lunch Start</label>
                  <input
                    type="time"
                    value={lunchStart}
                    onChange={(e) => setLunchStart(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Lunch End</label>
                  <input
                    type="time"
                    value={lunchEnd}
                    onChange={(e) => setLunchEnd(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Assigned Skills
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-input bg-background/50 max-h-48 overflow-y-auto">
                  {skillsList.map(sk => {
                    const isChecked = selectedSkillIds.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => toggleSkill(sk.id)}
                        className={`p-2 rounded-md text-xs font-medium border text-left flex items-center justify-between transition ${
                          isChecked
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>{sk.name}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-8 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-xs inline-flex items-center space-x-1.5 transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
