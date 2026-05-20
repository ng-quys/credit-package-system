export interface PurchaseHistoryItem {
  id: string
  transactionCode: string
  packageId: string | null
  amount: number
  credits: number
  status: string
  paymentMethod: string | null
  createdAt: string | null
}

export interface UnlockedFeatureItem {
  id: string
  code: string
  name: string
  description: string | null
}

export interface CreditUsageItem {
  id: string
  featureCode: string
  creditsUsed: number
  description: string | null
  createdAt: string | null
}
