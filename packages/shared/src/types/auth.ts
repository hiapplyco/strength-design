export interface User {
  id: string
  email: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface AuthSession {
  user: User
  access_token: string
  refresh_token?: string
  expires_at?: number
}

export interface AuthError {
  message: string
  status?: number
  code?: string
}