
export interface AuthState {
  isAuthenticated: boolean;
  user: any; // Replace with proper user type if available
  loading: boolean;
  error?: string;
}
