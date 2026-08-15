export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  created_at: string;
  updated_at: string;
}

export interface Court {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: number;
  base_price: number;
  open_time: string;
  close_time: string;
  slot_duration_minutes: number;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  court_id: string;
  team_name: string;
  start_time: string;
  end_time: string;
  price_at_booking: number;
  status: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO';
  user?: User;
  court?: Court;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface DashboardStats {
  month_revenue: number;
  confirmed_count: number;
  cancelled_count: number;
  pending_count: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
