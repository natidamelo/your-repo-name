const rawApiUrl = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8001/api';
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export function getAuthToken(): string | null {
  return localStorage.getItem('callcenter_token');
}

export function setAuthSession(token: string, role: string, username: string) {
  localStorage.setItem('callcenter_token', token);
  localStorage.setItem('callcenter_role', role);
  localStorage.setItem('callcenter_user', username);
}

export function clearAuthSession() {
  localStorage.removeItem('callcenter_token');
  localStorage.removeItem('callcenter_role');
  localStorage.removeItem('callcenter_user');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// Authentication
export async function loginApi(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Login failed');
  }
  return response.json();
}

export async function getCurrentUserApi() {
  return apiRequest('/auth/me');
}

// Employees
export async function getEmployeesApi() {
  return apiRequest('/employees/');
}

export async function getEmployeeApi(id: number) {
  return apiRequest(`/employees/${id}`);
}

export async function createEmployeeApi(data: any) {
  return apiRequest('/employees/', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateEmployeeApi(id: number, data: any) {
  return apiRequest(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deactivateEmployeeApi(id: number) {
  return apiRequest(`/employees/${id}`, {
    method: 'DELETE'
  });
}

// Skills
export async function getSkillsApi() {
  return apiRequest('/skills/');
}

// Schedules
export async function getSchedulesApi() {
  return apiRequest('/schedules/');
}

export async function getScheduleApi(id: number) {
  return apiRequest(`/schedules/${id}`);
}

export async function updateShiftApi(shiftId: number, data: any) {
  return apiRequest(`/schedules/shifts/${shiftId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function publishScheduleApi(scheduleId: number) {
  return apiRequest(`/schedules/${scheduleId}/publish`, {
    method: 'POST'
  });
}

export async function deleteScheduleApi(scheduleId: number) {
  return apiRequest(`/schedules/${scheduleId}`, {
    method: 'DELETE'
  });
}

export async function generateScheduleApi(data: {
  start_date: string;
  duration_weeks: number;
  schedule_type?: string;
  preview_only?: boolean;
}) {
  return apiRequest('/schedules/generate', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function validateScheduleApi(scheduleId: number) {
  return apiRequest(`/schedules/${scheduleId}/validate`);
}

// Coverage
export async function getDayCoverageApi(dateStr: string) {
  return apiRequest(`/coverage/day/${dateStr}`);
}

export async function getScheduleCoverageMatrixApi(scheduleId: number) {
  return apiRequest(`/coverage/matrix/${scheduleId}`);
}

// Task Assignments
export async function assignTaskApi(data: {
  shift_assignment_id: number;
  task_name: string;
  start_time: string;
  end_time: string;
  is_backup?: boolean;
  notes?: string;
}) {
  return apiRequest('/assignments/', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function deleteTaskAssignmentApi(taskId: number) {
  return apiRequest(`/assignments/${taskId}`, {
    method: 'DELETE'
  });
}

// Dashboard
export async function getDashboardSummaryApi(targetDate?: string, scheduleId?: number) {
  const params = new URLSearchParams();
  if (targetDate) params.append('target_date', targetDate);
  if (scheduleId) params.append('schedule_id', scheduleId.toString());
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/dashboard/summary${query}`);
}

// Settings
export async function getSettingsApi() {
  return apiRequest('/settings/');
}

export async function updateSettingApi(key: string, value: string) {
  return apiRequest(`/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ key, value })
  });
}

// Audit Logs
export async function getAuditLogsApi() {
  return apiRequest('/audit-logs/');
}

// Excel Export URL & Helper
export function getExcelExportUrl(scheduleId: number, startDate?: string, endDate?: string): string {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const queryString = params.toString();
  return `${API_BASE_URL}/schedules/${scheduleId}/export-excel${queryString ? `?${queryString}` : ''}`;
}

export function exportScheduleExcel(scheduleId: number, startDate?: string, endDate?: string) {
  const url = getExcelExportUrl(scheduleId, startDate, endDate);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', '');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
