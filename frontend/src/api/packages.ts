import { apiRequest } from './client'
import type { PackageItem } from '../types/package'

export function getPackages() {
  return apiRequest<PackageItem[]>('/packages')
}
