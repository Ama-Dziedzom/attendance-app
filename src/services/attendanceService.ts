import { supabase } from '../lib/supabase';

function todayDate() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export interface EmployeeRecord {
  id: string;
  name: string;
  email: string | null;
  emp_id: string | null;
  job_title: string | null;
  agency_id: string | null;
}

export interface AttendanceRecord {
  id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  status: string;
  total_hours: number | null;
}

/**
 * Look up employee by email first (pre-registered by HR),
 * create one if not found. agency_id left null — assign via admin.
 */
export async function findOrCreateEmployee(
  name: string,
  email: string,
): Promise<EmployeeRecord> {
  const { data: existing } = await supabase
    .from('employees')
    .select('id, name, email, emp_id, job_title, agency_id')
    .eq('email', email)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('employees')
    .insert({ name, email, is_active: true })
    .select('id, name, email, emp_id, job_title, agency_id')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Returns today's attendance row for the employee, or null if not yet clocked in. */
export async function fetchTodayAttendance(
  employeeId: string,
): Promise<AttendanceRecord | null> {
  const { data } = await supabase
    .from('attendance_records')
    .select('id, clock_in_time, clock_out_time, status, total_hours')
    .eq('employee_id', employeeId)
    .eq('date', todayDate())
    .maybeSingle();

  return data;
}

/**
 * Idempotent — returns existing record if already clocked in today.
 * verification_method uses 'manual' until 'qr' is added to the DB enum
 * in the full terminal system.
 */
export async function clockInEmployee(
  employeeId: string,
): Promise<AttendanceRecord> {
  const existing = await fetchTodayAttendance(employeeId);
  if (existing?.clock_in_time) return existing;

  const { data, error } = await supabase
    .from('attendance_records')
    .insert({
      employee_id: employeeId,
      date: todayDate(),
      clock_in_time: new Date().toISOString(),
      verification_method: 'manual',
    })
    .select('id, clock_in_time, clock_out_time, status, total_hours')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Updates clock_out_time on the existing row for today. */
export async function clockOutEmployee(
  employeeId: string,
): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from('attendance_records')
    .update({ clock_out_time: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .eq('date', todayDate())
    .is('clock_out_time', null)
    .select('id, clock_in_time, clock_out_time, status, total_hours')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No open clock-in found for today.');
  return data;
}

/** All email domains registered across active agencies. */
export async function fetchEmailDomains(): Promise<string[]> {
  const { data } = await supabase
    .from('agencies')
    .select('email_domains')
    .eq('is_active', true);

  return (data ?? []).flatMap((a) => (a.email_domains as string[]) ?? []);
}

/**
 * Returns the list of allowed IP subnets for the agency.
 * Empty array means no restriction is configured (allow any WiFi).
 */
export async function fetchAgencyAllowedSubnets(agencyId: string): Promise<string[]> {
  const { data } = await supabase
    .from('agencies')
    .select('network_config')
    .eq('id', agencyId)
    .single();

  return (data?.network_config?.allowed_subnets as string[]) ?? [];
}

export interface EmployeeDetails {
  emp_id: string | null;
  name: string;
  email: string | null;
  job_title: string | null;
  employment_type: string | null;
  date_join: string | null;
  is_active: boolean;
}

export interface AgencyDetails {
  id: string;
  name: string;
  agency_code: string | null;
  address: string | null;
  network_config: { allowed_subnets: string[]; description?: string } | null;
}

/** Full employee profile for Account Details screen. */
export async function fetchEmployeeDetails(employeeId: string): Promise<EmployeeDetails> {
  const { data, error } = await supabase
    .from('employees')
    .select('emp_id, name, email, job_title, employment_type, date_join, is_active')
    .eq('id', employeeId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Agency info for Workplace screen. */
export async function fetchAgencyDetails(agencyId: string): Promise<AgencyDetails> {
  const { data, error } = await supabase
    .from('agencies')
    .select('id, name, agency_code, address, network_config')
    .eq('id', agencyId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Last 30 days of attendance for the employee. */
export async function fetchAttendanceHistory(
  employeeId: string,
  limit = 30,
): Promise<AttendanceRecord[]> {
  const { data } = await supabase
    .from('attendance_records')
    .select('id, clock_in_time, clock_out_time, status, total_hours')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })
    .limit(limit);

  return data ?? [];
}
