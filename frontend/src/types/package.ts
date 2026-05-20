export interface PackageFeature {
  id: string
  code: string
  name: string
}

export interface PackageItem {
  id: string
  name: string
  description: string | null
  price: number
  credits: number
  isActive: boolean
  features: PackageFeature[]
  createdAt: string | null
  updatedAt: string | null
}

export interface AdminPackagePayload {
  name: string
  description: string
  price: number
  credits: number
  isActive: boolean
  featureIds: number[]
}

export interface PurchaseResponse {
  transaction: {
    id: string
    transactionCode: string
    amount: number
    credits: number
    status: string
    paymentMethod: string | null
    createdAt: string | null
  }
  creditBalance: number
  unlockedFeatures: PackageFeature[]
}

export interface CreditBalanceResponse {
  balance: number
}
