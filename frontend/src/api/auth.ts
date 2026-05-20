import { apiRequest } from './client'
import type { AuthResponse, CurrentUser, LoginPayload, RegisterPayload } from '../types/auth'

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCurrentUser(token: string) {
  return apiRequest<CurrentUser>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
