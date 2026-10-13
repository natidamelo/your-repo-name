import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  VolumeX,
  Volume2,
  Coffee, 
  Clock, 
  Check, 
  X, 
  RotateCw,
  Search,
  AlertTriangle,
  Info,
  CalendarCheck,
  ShieldCheck
} from 'lucide-react';
import { 
  getEmployeesApi, 
  updateEmployeeApi, 
  createEmployeeApi, 
  deleteEmployeeApi, 
  getSkillsApi 
} from '../api/client';
import { Employee, Skill } from '../types';

const AVAILABLE_SPECIAL_RULES = [
  { code: 'SUNDAY_ALTERNATING', label: 'Sunday Lead Rotation' },
  { code: 'SATURDAY_ROTATION', label: 'Saturday Half-Day Lead' },
  { code: 'SUNDAY_NEVER_WORK', label: 'Sunday Strictly OFF' },
  { code: 'EARLY_MORNING', label: 'Early Morning (08:00)' },
  { code: 'YEAB_COVERS_BETI', label: 'Covers Beti' },
  { code: 'CALL_CENTER_LUNCH_COVER', label: 'Lunch CC Cover' },
  { code: 'TELEGRAM_BACKUP', label: 'Backup Telegram' },
  { code: 'TWO_DAYS_OFF', label: '2 Days Off Weekly' },
];

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'silent'>('all');

  // Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [position, setPosition] = useState<string>('Call Center Agent');
  const [workStart, setWorkStart] = useState<string>('08:00');
  const [workEnd, setWorkEnd] = useState<string>('17:00');
  const [lunchStart, setLunchStart] = useState<string>('12:00');
  const [lunchEnd, setLunchEnd] = useState<string>('13:00');
  const [isActiveStatus, setIsActiveStatus] = useState<boolean>(true);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Delete / Silent Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'silent' | 'activate' | 'permanent';
    employee: Employee | null;
  }>({
    isOpen: false,
    type: 'silent',
    employee: null
  });
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

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
    setWorkStart('08:00');
    setWorkEnd('17:00');
    setLunchStart('12:00');
    setLunchEnd('13:00');
    setIsActiveStatus(true);
    setSelectedSkillIds([]);
    setSelectedRules(['TWO_DAYS_OFF']);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFirstName(emp.first_name);
    setLastName(emp.last_name || '');
    setPosition(emp.position);
    setWorkStart(emp.working_hours?.[0]?.start_time || '08:00');
    setWorkEnd(emp.working_hours?.[0]?.end_time || '17:00');
    setLunchStart(emp.lunch_break?.start_time || '12:00');
    setLunchEnd(emp.lunch_break?.end_time || '13:00');
    setIsActiveStatus(emp.is_active);
    setSelectedSkillIds(emp.skills.map(s => s.skill_id));
    setSelectedRules(emp.special_rules ? emp.special_rules.map(r => r.rule_type) : []);
    setIsModalOpen(true);
  };

  const toggleSkill = (id: number) => {
    setSelectedSkillIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleRule = (code: string) => {
    setSelectedRules(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
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
          is_active: isActiveStatus,
          skill_ids: selectedSkillIds,
          special_rules: selectedRules
        });
      } else {
        await createEmployeeApi({
          first_name: firstName,
          last_name: lastName,
          position,
          lunch_start: lunchStart,
          lunch_end: lunchEnd,
          is_active: isActiveStatus,
          skill_ids: selectedSkillIds,
          special_rules: selectedRules
        });
      }
      setIsModalOpen(false);
      await fetchEmployeesAndSkills();
    } catch (err: any) {
      alert(err.message || 'Failed to save employee profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Silent (Deactivate / Reactivate)
  const handleToggleSilent = async (emp: Employee, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsProcessingAction(true);
    try {
      if (emp.is_active) {
        // Silencing (deactivating)
        await deleteEmployeeApi(emp.id, false);
      } else {
        // Re-activating
        await updateEmployeeApi(emp.id, { is_active: true });
      }
      setConfirmModal({ isOpen: false, type: 'silent', employee: null });
      await fetchEmployeesAndSkills();
    } catch (err: any) {
      alert(err.message || 'Failed to update employee status');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async () => {
    if (!confirmModal.employee) return;
    setIsProcessingAction(true);
    try {
      await deleteEmployeeApi(confirmModal.employee.id, true);
      setConfirmModal({ isOpen: false, type: 'permanent', employee: null });
      await fetchEmployeesAndSkills();
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee profile');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterStatus === 'active') return emp.is_active;
    if (filterStatus === 'silent') return !emp.is_active;
    return true;
  });

  const activeCount = employees.filter(e => e.is_active).length;
  const silentCount = employees.filter(e => !e.is_active).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-secondary text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span>Staff Management & Skill Profiles</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {activeCount} Active / {silentCount} Silent
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {employees.length} total call center profiles synced with operational schedules & rule constraints
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={openAddModal}
            className="h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-xs inline-flex items-center space-x-1.5 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/60">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center space-x-1 bg-secondary/60 p-1 rounded-md border border-border text-xs w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded transition font-medium ${filterStatus === 'all' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All ({employees.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1 rounded transition font-medium ${filterStatus === 'active' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('silent')}
            className={`px-3 py-1 rounded transition font-medium flex items-center space-x-1 ${filterStatus === 'silent' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <VolumeX className="w-3 h-3 text-amber-500" />
            <span>Silent ({silentCount})</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RotateCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(emp => {
            const rules = emp.special_rules?.map(r => r.rule_type) || [];
            const isLead = rules.includes('SUNDAY_ALTERNATING') || rules.includes('SATURDAY_ROTATION') || emp.first_name.toLowerCase() === 'hebron' || emp.first_name.toLowerCase() === 'beti' || emp.first_name.toLowerCase() === 'bethel';
            const isSundayRestricted = rules.includes('SUNDAY_NEVER_WORK') || emp.first_name.toLowerCase() === 'yordi' || emp.first_name.toLowerCase() === 'yordanos' || emp.first_name.toLowerCase() === 'obsa' || emp.first_name.toLowerCase() === 'obsan';
            const isCoverageLead = rules.includes('YEAB_COVERS_BETI') || emp.first_name.toLowerCase() === 'yeab';
            const isEarlyMorning = rules.includes('EARLY_MORNING') || ['shalom', 'rediet', 'tirsit'].includes(emp.first_name.toLowerCase());
            const isLunchCover = rules.includes('CALL_CENTER_LUNCH_COVER');
            const isTelegramBackup = rules.includes('TELEGRAM_BACKUP');
            const isSilent = !emp.is_active;

            return (
              <div
                key={emp.id}
                className={`p-5 rounded-xl border transition flex flex-col justify-between space-y-4 shadow-xs ${
                  isSilent 
                    ? 'border-dashed border-amber-300/80 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10 opacity-80' 
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isSilent 
                            ? 'bg-amber-400 ring-2 ring-amber-400/20' 
                            : isLead 
                              ? 'bg-primary ring-2 ring-primary/20' 
                              : 'bg-emerald-400 ring-2 ring-emerald-400/20'
                        }`} />
                        <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                          <span>{emp.full_name}</span>
                          {isSilent && (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                              <VolumeX className="w-2.5 h-2.5" />
                              <span>Silent</span>
                            </span>
                          )}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.position}</p>
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* Silent / Unsilent Toggle Button */}
                      <button
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          type: isSilent ? 'activate' : 'silent',
                          employee: emp
                        })}
                        className={`p-1.5 rounded-md transition ${
                          isSilent
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100/50 dark:text-amber-400 dark:hover:bg-amber-950/50'
                            : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }`}
                        title={isSilent ? 'Un-silence (Reactivate for Schedule)' : 'Silent Mode (Temporarily Exclude from Schedule)'}
                      >
                        {isSilent ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition"
                        title="Edit Profile"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Permanent Delete Button */}
                      <button
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          type: 'permanent',
                          employee: emp
                        })}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                    {isEarlyMorning && (
                      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold">
                        08:00 Early
                      </span>
                    )}
                    {isCoverageLead && (
                      <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-800/40 dark:bg-indigo-950/30 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-semibold">
                        Covers Beti
                      </span>
                    )}
                    {isLunchCover && (
                      <span className="inline-flex items-center rounded-full border border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-800/40 dark:bg-purple-950/30 dark:text-purple-300 px-2 py-0.5 text-[10px] font-semibold">
                        Lunch CC
                      </span>
                    )}
                    {isTelegramBackup && (
                      <span className="inline-flex items-center rounded-full border border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-800/40 dark:bg-teal-950/30 dark:text-teal-300 px-2 py-0.5 text-[10px] font-semibold">
                        Telegram BKP
                      </span>
                    )}
                    {rules.includes('TWO_DAYS_OFF') && (
                      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                        2 Days Off
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
                      {emp.skills.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No specific skills assigned</span>
                      ) : (
                        emp.skills.map(s => (
                          <span
                            key={s.id}
                            className="inline-flex items-center rounded-md border border-border bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                          >
                            {s.skill_name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {isSilent && (
                  <div className="pt-2 border-t border-border/60 text-[11px] text-amber-600 dark:text-amber-400 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium">
                      <Info className="w-3.5 h-3.5" />
                      <span>Excluded from Schedule Engine</span>
                    </span>
                    <button
                      onClick={(e) => handleToggleSilent(emp, e)}
                      className="underline font-semibold hover:text-amber-700"
                    >
                      Activate
                    </button>
                  </div>
                )}
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
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {editingEmployee ? `Edit ${editingEmployee.full_name}` : 'Add New Employee'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure schedule hours, lunch breaks, and rules compatibility
                </p>
              </div>
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
                  <label className="block text-xs font-medium text-foreground mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Hebron"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Tekle"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Position Title *</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Call Center Agent"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Status (Schedule Participation)</label>
                  <select
                    value={isActiveStatus ? 'active' : 'silent'}
                    onChange={(e) => setIsActiveStatus(e.target.value === 'active')}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="active">Active (Scheduled)</option>
                    <option value="silent">Silent / Inactive (Excluded)</option>
                  </select>
                </div>
              </div>

              {/* Working Hours & Lunch Times */}
              <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-3">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Shift & Lunch Schedule Configuration</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Standard Work Start</label>
                    <input
                      type="time"
                      value={workStart}
                      onChange={(e) => setWorkStart(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Standard Work End</label>
                    <input
                      type="time"
                      value={workEnd}
                      onChange={(e) => setWorkEnd(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Lunch Break Start</label>
                    <input
                      type="time"
                      value={lunchStart}
                      onChange={(e) => setLunchStart(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Lunch Break End</label>
                    <input
                      type="time"
                      value={lunchEnd}
                      onChange={(e) => setLunchEnd(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center justify-between">
                  <span>Assigned Channel & System Skills ({selectedSkillIds.length})</span>
                  <span className="text-[10px] text-muted-foreground">Select qualified skills</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-input bg-background/50 max-h-36 overflow-y-auto">
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

              {/* Special Rules */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Special Fixed Operational Rules ({selectedRules.length})</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">Governs scheduling validator</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-input bg-background/50 max-h-36 overflow-y-auto">
                  {AVAILABLE_SPECIAL_RULES.map(r => {
                    const isChecked = selectedRules.includes(r.code);
                    return (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => toggleRule(r.code)}
                        className={`p-2 rounded-md text-xs font-medium border text-left flex items-center justify-between transition ${
                          isChecked
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>{r.label}</span>
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

      {/* Confirmation Modal for Silent Mode / Permanent Delete */}
      {confirmModal.isOpen && confirmModal.employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${
                confirmModal.type === 'permanent' 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
              }`}>
                {confirmModal.type === 'permanent' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {confirmModal.type === 'permanent' 
                    ? `Delete ${confirmModal.employee.full_name}?` 
                    : confirmModal.type === 'silent'
                      ? `Silence ${confirmModal.employee.full_name}?`
                      : `Reactivate ${confirmModal.employee.full_name}?`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {confirmModal.type === 'permanent' 
                    ? 'Permanent action' 
                    : 'Schedule compatibility toggle'}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {confirmModal.type === 'permanent' ? (
                <>
                  Are you sure you want to permanently delete <strong>{confirmModal.employee.full_name}</strong>? 
                  This will remove their profile and detach any linked attendance and schedule shifts.
                </>
              ) : confirmModal.type === 'silent' ? (
                <>
                  Silencing <strong>{confirmModal.employee.full_name}</strong> will deactivate them without deleting data. 
                  The schedule engine will skip them, preventing rule conflicts and ensuring coverage balance.
                </>
              ) : (
                <>
                  Reactivating <strong>{confirmModal.employee.full_name}</strong> will re-include them in future schedule generation and rule validations.
                </>
              )}
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setConfirmModal({ isOpen: false, type: 'silent', employee: null })}
                className="h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
              {confirmModal.type === 'permanent' ? (
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handlePermanentDelete}
                  className="h-8 px-4 rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-medium shadow-xs inline-flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isProcessingAction ? 'Deleting...' : 'Permanently Delete'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => handleToggleSilent(confirmModal.employee!)}
                  className={`h-8 px-4 rounded-md text-xs font-medium shadow-xs inline-flex items-center space-x-1.5 transition disabled:opacity-50 ${
                    confirmModal.type === 'silent'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }`}
                >
                  {confirmModal.type === 'silent' ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isProcessingAction ? 'Updating...' : confirmModal.type === 'silent' ? 'Confirm Silence' : 'Reactivate'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

