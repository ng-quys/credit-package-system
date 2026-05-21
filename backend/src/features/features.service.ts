import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FEATURE_CREDIT_COST } from './constants/feature.constants';

@Injectable()
export class FeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  // Deduct credits and write usage history in the same transaction to keep balance/history consistent.
  async useFeature(
    userId: string,
    featureCode: keyof typeof FEATURE_CREDIT_COST,
  ) {
    const parsedUserId = this.parseUserId(userId);
    const creditsRequired = FEATURE_CREDIT_COST[featureCode];

    if (!creditsRequired) {
      throw new NotFoundException('Feature not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const feature = await tx.features.findUnique({
        where: { code: featureCode },
        select: {
          id: true,
          code: true,
        },
      });

      if (!feature) {
        throw new NotFoundException('Feature not found');
      }

      // Read the latest balance inside the transaction before deciding whether usage is allowed.
      const currentCredits = await tx.user_credits.findUnique({
        where: { user_id: parsedUserId },
        select: {
          id: true,
          balance: true,
        },
      });

      const currentBalance = currentCredits?.balance ?? 0;

      if (currentBalance < creditsRequired) {
        throw new BadRequestException('Insufficient credits');
      }

      // Update the balance first, then persist an audit row for the feature usage.
      const updatedCredits = await tx.user_credits.update({
        where: { user_id: parsedUserId },
        data: {
          balance: currentBalance - creditsRequired,
          updated_at: new Date(),
        },
        select: {
          balance: true,
        },
      });

      await tx.credit_usages.create({
        data: {
          user_id: parsedUserId,
          feature_code: feature.code,
          credits_used: creditsRequired,
          description: `Used feature ${feature.code}`,
        },
      });

      return {
        message: `${feature.code} feature used successfully`,
        creditsUsed: creditsRequired,
        remainingBalance: updatedCredits.balance,
      };
    });

    return result;
  }

  private parseUserId(userId: string): bigint {
    try {
      return BigInt(userId);
    } catch {
      throw new BadRequestException('Invalid user id');
    }
  }
}
