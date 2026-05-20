import { apiRequest } from './client'
import type { PurchaseHistoryItem } from '../types/dashboard'
import type { CreditBalanceResponse, PurchaseResponse } from '../types/package'

export function purchasePackage(packageId: string, token: string) {
  return apiRequest<PurchaseResponse>(`/purchases/packages/${packageId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getCurrentCredits(token: string) {
  return apiRequest<CreditBalanceResponse>('/users/me/credits', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getPurchaseHistory(token: string) {
  return apiRequest<PurchaseHistoryItem[]>('/purchases/history', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
