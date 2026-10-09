export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  employee_id?: number | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Skill {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface EmployeeSkill {
  id: number;
  skill_id: number;
  skill_code: string;
  skill_name: string;
  proficiency_level: string;
}

export interface WorkingHour {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_work_day: boolean;
}

export interface LunchBreak {
  id: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

export interface SpecialRule {
  id: number;
  rule_type: string;
  config_json?: string;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  notes?: string;
  skills: EmployeeSkill[];
  working_hours: WorkingHour[];
  lunch_break?: LunchBreak;
  special_rules: SpecialRule[];
}

export type ShiftType = 'WORK' | 'OFF' | 'AM_HALF' | 'PM_HALF' | 'SUNDAY_DUTY';

export interface TaskAssignment {
  id?: number;
  task_name: string;
  start_time: string;
  end_time: string;
  is_backup: boolean;
  notes?: string;
}

export interface ShiftAssignment {
  id: number;
  employee_id: number;
  employee_name: string;
  shift_type: ShiftType;
  start_time?: string;
  end_time?: string;
  lunch_start?: string;
  lunch_end?: string;
  primary_task?: string;
  secondary_task?: string;
  assigned_tasks?: string[];
  notes?: string;
  tasks?: TaskAssignment[];
  skills?: string[];
  employee_position?: string;
}

export interface ScheduleDay {
  id: number;
  date: string; // YYYY-MM-DD
  day_of_week: number; // 0=Mon, 6=Sun
  is_weekend: boolean;
  shifts: ShiftAssignment[];
}

export interface ScheduleConflict {
  id?: number;
  date?: string;
  employee_name?: string;
  severity: 'critical' | 'warning';
  error_type: string;
  message: string;
  suggestion?: string;
}

export interface SchedulePeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  status: 'draft' | 'published' | 'archived';
  generated_by?: string;
  created_at?: string;
  days: ScheduleDay[];
  conflicts: ScheduleConflict[];
}

export interface TimeSlotCoverage {
  slot_index: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  staff_count: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  staff_names: string[];
}

export interface ChannelCoverage {
  channel: string;
  available_staff_count: number;
  target_count: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  staff_names: string[];
}

export interface DayCoverageSummary {
  date: string;
  day_of_week: number;
  is_sunday: boolean;
  is_saturday: boolean;
  time_slots: TimeSlotCoverage[];
  channels: ChannelCoverage[];
}

export interface DashboardSummary {
  schedule_id?: number;
  schedule_name?: string;
  schedule_start?: string;
  schedule_end?: string;
  reference_date: string;
  day_of_week: string;
  total_staff: number;
  working_today_count: number;
  off_today_count: number;
  working_staff: any[];
  off_staff: any[];
  red_slots_count: number;
  yellow_slots_count: number;
  conflicts_count: number;
  time_slot_coverage: TimeSlotCoverage[];
  channel_coverage: ChannelCoverage[];
  schedule_days?: {
    date: string;
    day_name: string;
    day_num: number;
    weekday_full: string;
    is_weekend: boolean;
    is_sunday: boolean;
    is_saturday: boolean;
  }[];
  all_schedules?: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  }[];
  upcoming_saturday: {
    date: string;
    formatted_date: string;
    week_type: 'A' | 'B';
    am_staff?: { name: string; hours: string; notes?: string }[];
    pm_staff?: { name: string; hours: string; notes?: string }[];
    full_staff?: { name: string; hours: string; notes?: string }[];
    off_staff?: { name: string; hours: string; notes?: string }[];
    hebron?: any;
    beti?: any;
  };
  upcoming_sunday: {
    date: string;
    formatted_date: string;
    duty_lead: string;
    off_lead?: string;
    squad_staff: string[];
    squad_details?: { name: string; hours: string; tasks: string[]; notes?: string; position?: string }[];
    off_staff?: string[];
    total_squad: number;
  };
}

export interface ValidationChecklist {
  staff_count_configured: boolean;
  sunday_staffing_valid: boolean;
  saturday_rotation_valid: boolean;
  days_off_valid: boolean;
  early_morning_valid?: boolean;
  gds_capability_valid?: boolean;
  lunch_coverage_valid?: boolean;
  call_center_coverage_valid: boolean;
}

export interface ValidationResult {
  is_valid: boolean;
  critical_errors: number;
  warnings: number;
  conflicts: ScheduleConflict[];
  checklist: ValidationChecklist;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export interface SystemConstraint {
  id: number;
  title: string;
  category: string;
  description: string;
  staff_names?: string;
  rule_key?: string;
  is_active: boolean;
  is_system?: boolean;
  config_json?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLogItem {
  id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  date_time: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
}
