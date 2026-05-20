import { apiRequest } from './client'
import type { CreditUsageItem, UnlockedFeatureItem } from '../types/dashboard'

export function getUnlockedFeatures(token: string) {
  return apiRequest<UnlockedFeatureItem[]>('/users/me/features', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getCreditUsages(token: string) {
  return apiRequest<CreditUsageItem[]>('/users/me/credit-usages', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
