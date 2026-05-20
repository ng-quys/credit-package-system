export class PackageFeatureResponseDto {
  id!: string;
  code!: string;
  name!: string;
}

export class PackageResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  price!: number;
  credits!: number;
  isActive!: boolean;
  features!: PackageFeatureResponseDto[];
  createdAt!: string | null;
  updatedAt!: string | null;
}
