import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PAYMENT_METHOD,
  TRANSACTION_STATUS,
} from '../common/constants/payment.constants';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseHistoryResponseDto } from './dto/purchase-history-response.dto';
import { PurchasePackageResponseDto } from './dto/purchase-package-response.dto';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPurchaseHistoryForCurrentUser(
    userId: string,
  ): Promise<PurchaseHistoryResponseDto[]> {
    const parsedUserId = this.parseId(userId, 'user id');
    const transactions = await this.prisma.transactions.findMany({
      where: { user_id: parsedUserId },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    });

    return transactions.map((transaction) => ({
      id: transaction.id.toString(),
      transactionCode: transaction.transaction_code,
      packageId: transaction.package_id
        ? transaction.package_id.toString()
        : null,
      amount: Number(transaction.amount),
      credits: transaction.credits,
      status: transaction.status,
      paymentMethod: transaction.payment_method ?? null,
      createdAt: transaction.created_at
        ? transaction.created_at.toISOString()
        : null,
    }));
  }

  // Purchase flow is transactional so transaction record, credits, and unlocked features stay in sync.
  async purchasePackage(
    packageId: string,
    userId: string,
  ): Promise<PurchasePackageResponseDto> {
    const parsedPackageId = this.parseId(packageId, 'package id');
    const parsedUserId = this.parseId(userId, 'user id');

    const result = await this.prisma.$transaction(async (tx) => {
      const foundPackage = await tx.packages.findFirst({
        where: {
          id: parsedPackageId,
          is_active: true,
        },
        include: {
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
        },
      });

      if (!foundPackage) {
        throw new NotFoundException('Package not found');
      }

      const transactionCode = `TXN_${parsedUserId.toString()}_${parsedPackageId.toString()}_${Date.now()}`;

      // This demo flow records a successful fake payment immediately before applying entitlements.
      const createdTransaction = await tx.transactions.create({
        data: {
          transaction_code: transactionCode,
          user_id: parsedUserId,
          package_id: parsedPackageId,
          amount: foundPackage.price,
          credits: foundPackage.credits,
          status: TRANSACTION_STATUS.SUCCESS,
          payment_method: PAYMENT_METHOD.FAKE_PAYMENT,
        },
      });

      // Credits are upserted so first-time buyers and returning buyers share the same flow.
      const creditRecord = await tx.user_credits.upsert({
        where: { user_id: parsedUserId },
        update: {
          balance: {
            increment: foundPackage.credits,
          },
          updated_at: new Date(),
        },
        create: {
          user_id: parsedUserId,
          balance: foundPackage.credits,
        },
      });

      const packageFeatures = foundPackage.package_features.map(
        (relation) => relation.features,
      );
      const packageFeatureIds = packageFeatures.map((feature) => feature.id);

      if (packageFeatureIds.length > 0) {
        const existingUserFeatures = await tx.user_features.findMany({
          where: {
            user_id: parsedUserId,
            feature_id: {
              in: packageFeatureIds,
            },
          },
          select: {
            feature_id: true,
          },
        });

        // Only insert missing feature unlocks so repeat purchases can safely add credits without duplicate rows.
        const existingFeatureIdSet = new Set(
          existingUserFeatures.map((item) => item.feature_id.toString()),
        );
        const missingFeatureIds = packageFeatureIds.filter(
          (featureId) => !existingFeatureIdSet.has(featureId.toString()),
        );

        if (missingFeatureIds.length > 0) {
          await tx.user_features.createMany({
            data: missingFeatureIds.map((featureId) => ({
              user_id: parsedUserId,
              feature_id: featureId,
              source_transaction_id: createdTransaction.id,
            })),
          });
        }
      }

      return {
        transaction: {
          id: createdTransaction.id.toString(),
          transactionCode: createdTransaction.transaction_code,
          amount: Number(createdTransaction.amount),
          credits: createdTransaction.credits,
          status: createdTransaction.status,
          paymentMethod: createdTransaction.payment_method ?? null,
          createdAt: createdTransaction.created_at
            ? createdTransaction.created_at.toISOString()
            : null,
        },
        creditBalance: creditRecord.balance,
        unlockedFeatures: packageFeatures.map((feature) => ({
          id: feature.id.toString(),
          code: feature.code,
          name: feature.name,
        })),
      } satisfies PurchasePackageResponseDto;
    });

    return result;
  }

  private parseId(value: string, fieldName: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }
  }
}
