export class PurchasedFeatureResponseDto {
  id!: string;
  code!: string;
  name!: string;
}

export class PurchaseTransactionResponseDto {
  id!: string;
  transactionCode!: string;
  amount!: number;
  credits!: number;
  status!: string;
  paymentMethod!: string | null;
  createdAt!: string | null;
}

export class PurchasePackageResponseDto {
  transaction!: PurchaseTransactionResponseDto;
  creditBalance!: number;
  unlockedFeatures!: PurchasedFeatureResponseDto[];
}
