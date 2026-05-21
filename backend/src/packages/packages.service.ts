import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { PackageResponseDto } from './dto/package-response.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

const packageInclude = {
  package_features: {
    include: {
      features: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      feature_id: 'asc',
    },
  },
} satisfies Prisma.packagesInclude;

type PackageWithFeatures = Prisma.packagesGetPayload<{
  include: typeof packageInclude;
}>;

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findActivePackages(): Promise<PackageResponseDto[]> {
    const packages = await this.prisma.packages.findMany({
      where: { is_active: true },
      include: packageInclude,
      orderBy: { id: 'asc' },
    });

    return packages.map((item) => this.toResponse(item));
  }

  async findPackageDetail(id: string): Promise<PackageResponseDto> {
    const packageId = this.parseId(id);

    const foundPackage = await this.prisma.packages.findFirst({
      where: {
        id: packageId,
        is_active: true,
      },
      include: packageInclude,
    });

    if (!foundPackage) {
      throw new NotFoundException('Package not found');
    }

    return this.toResponse(foundPackage);
  }

  async findAllPackagesForAdmin(): Promise<PackageResponseDto[]> {
    const packages = await this.prisma.packages.findMany({
      include: packageInclude,
      orderBy: { id: 'asc' },
    });

    return packages.map((item) => this.toResponse(item));
  }

  // Admin create/update keep package rows and package-feature links consistent inside one transaction.
  async createPackageForAdmin(
    dto: CreatePackageDto,
  ): Promise<PackageResponseDto> {
    const featureIds = dto.featureIds ?? [];
    await this.ensureFeaturesExist(featureIds);

    const created = await this.prisma.$transaction(async (tx) => {
      const createdPackage = await tx.packages.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          price: new Prisma.Decimal(dto.price),
          credits: dto.credits,
          is_active: dto.isActive,
        },
      });

      if (featureIds.length > 0) {
        await tx.package_features.createMany({
          data: featureIds.map((featureId) => ({
            package_id: createdPackage.id,
            feature_id: BigInt(featureId),
          })),
        });
      }

      return tx.packages.findUniqueOrThrow({
        where: { id: createdPackage.id },
        include: packageInclude,
      });
    });

    return this.toResponse(created);
  }

  async updatePackageForAdmin(
    id: string,
    dto: UpdatePackageDto,
  ): Promise<PackageResponseDto> {
    const packageId = this.parseId(id);
    await this.ensurePackageExists(packageId);

    const featureIds = dto.featureIds;
    if (featureIds) {
      await this.ensureFeaturesExist(featureIds);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.packages.update({
        where: { id: packageId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.price !== undefined
            ? { price: new Prisma.Decimal(dto.price) }
            : {}),
          ...(dto.credits !== undefined ? { credits: dto.credits } : {}),
          ...(dto.isActive !== undefined ? { is_active: dto.isActive } : {}),
          updated_at: new Date(),
        },
      });

      if (featureIds) {
        await tx.package_features.deleteMany({
          where: { package_id: packageId },
        });

        if (featureIds.length > 0) {
          await tx.package_features.createMany({
            data: featureIds.map((featureId) => ({
              package_id: packageId,
              feature_id: BigInt(featureId),
            })),
          });
        }
      }

      return tx.packages.findUniqueOrThrow({
        where: { id: packageId },
        include: packageInclude,
      });
    });

    return this.toResponse(updated);
  }

  // Soft delete keeps package history intact while hiding the package from the public catalog.
  async softDeletePackageForAdmin(id: string): Promise<PackageResponseDto> {
    const packageId = this.parseId(id);
    await this.ensurePackageExists(packageId);

    const updated = await this.prisma.packages.update({
      where: { id: packageId },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
      include: packageInclude,
    });

    return this.toResponse(updated);
  }

  // Validate referenced features up front so package writes fail fast with a clear API error.
  private async ensureFeaturesExist(featureIds: number[]) {
    if (featureIds.length === 0) {
      return;
    }

    const features = await this.prisma.features.findMany({
      where: {
        id: {
          in: featureIds.map((featureId) => BigInt(featureId)),
        },
      },
      select: { id: true },
    });

    if (features.length !== featureIds.length) {
      throw new BadRequestException('One or more featureIds do not exist');
    }
  }

  private async ensurePackageExists(packageId: bigint) {
    const existingPackage = await this.prisma.packages.findUnique({
      where: { id: packageId },
      select: { id: true },
    });

    if (!existingPackage) {
      throw new NotFoundException('Package not found');
    }
  }

  private parseId(id: string): bigint {
    try {
      return BigInt(id);
    } catch {
      throw new BadRequestException('Invalid package id');
    }
  }

  // Centralize response mapping so public/admin endpoints return the same serialized package shape.
  private toResponse(item: PackageWithFeatures): PackageResponseDto {
    return {
      id: item.id.toString(),
      name: item.name,
      description: item.description ?? null,
      price: Number(item.price),
      credits: item.credits,
      isActive: Boolean(item.is_active),
      features: item.package_features.map((relation) => ({
        id: relation.features.id.toString(),
        code: relation.features.code,
        name: relation.features.name,
      })),
      createdAt: item.created_at ? item.created_at.toISOString() : null,
      updatedAt: item.updated_at ? item.updated_at.toISOString() : null,
    };
  }
}
