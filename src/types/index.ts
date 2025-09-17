export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'manager' | 'user';
  status: 'online' | 'offline';
}

export interface Organization {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  locations: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviews: number;
  avgRank: number;
  status: 'active' | 'inactive' | 'pending';
  verified: boolean;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  timestamp: string;
  read: boolean;
}

export interface DashboardStats {
  totalLocations: number;
  averageRating: number;
  totalReviews: number;
  averageRank: number;
}

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}