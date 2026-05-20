import { apiRequest } from './client'
import type { AdminPackagePayload, PackageItem } from '../types/package'

function authHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export function getAdminPackages(token: string) {
  return apiRequest<PackageItem[]>('/packages/admin', {
    headers: authHeader(token),
  })
}

export function createAdminPackage(token: string, payload: AdminPackagePayload) {
  return apiRequest<PackageItem>('/packages/admin', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify(payload),
  })
}

export function updateAdminPackage(token: string, packageId: string, payload: AdminPackagePayload) {
  return apiRequest<PackageItem>(`/packages/admin/${packageId}`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify(payload),
  })
}

export function softDeleteAdminPackage(token: string, packageId: string) {
  return apiRequest<PackageItem>(`/packages/admin/${packageId}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
}
