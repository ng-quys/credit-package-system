export class CreditUsageResponseDto {
  id!: string;
  featureCode!: string;
  creditsUsed!: number;
  description!: string | null;
  createdAt!: string | null;
}
