export type AuthMode = 'login' | 'register'

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string | null
  updatedAt: string | null
}

export interface AuthResponse {
  user: CurrentUser
  accessToken: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}
