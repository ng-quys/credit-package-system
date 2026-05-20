export class PurchaseHistoryResponseDto {
  id!: string;
  transactionCode!: string;
  packageId!: string | null;
  amount!: number;
  credits!: number;
  status!: string;
  paymentMethod!: string | null;
  createdAt!: string | null;
}
