import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditUsageResponseDto } from './dto/credit-usage-response.dto';
import { UserCreditsResponseDto } from './dto/user-credits-response.dto';
import { UserFeatureResponseDto } from './dto/user-feature-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.users.findUnique({ where: { email } });
  }

  findById(id: bigint) {
    return this.prisma.users.findUnique({ where: { id } });
  }

  // Dashboard reads are scoped to the authenticated JWT subject, not a caller-supplied user id.
  async getCreditsForCurrentUser(
    userId: string,
  ): Promise<UserCreditsResponseDto> {
    const parsedUserId = this.parseUserId(userId);
    const userCredits = await this.prisma.user_credits.findUnique({
      where: { user_id: parsedUserId },
      select: { balance: true },
    });

    return {
      balance: userCredits?.balance ?? 0,
    };
  }

  async getUnlockedFeaturesForCurrentUser(
    userId: string,
  ): Promise<UserFeatureResponseDto[]> {
    const parsedUserId = this.parseUserId(userId);
    const unlockedFeatures = await this.prisma.user_features.findMany({
      where: { user_id: parsedUserId },
      include: {
        features: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        feature_id: 'asc',
      },
    });

    return unlockedFeatures.map((item) => ({
      id: item.features.id.toString(),
      code: item.features.code,
      name: item.features.name,
      description: item.features.description ?? null,
    }));
  }

  async getCreditUsageHistoryForCurrentUser(
    userId: string,
  ): Promise<CreditUsageResponseDto[]> {
    const parsedUserId = this.parseUserId(userId);
    const creditUsages = await this.prisma.credit_usages.findMany({
      where: { user_id: parsedUserId },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    });

    return creditUsages.map((usage) => ({
      id: usage.id.toString(),
      featureCode: usage.feature_code,
      creditsUsed: usage.credits_used,
      description: usage.description ?? null,
      createdAt: usage.created_at ? usage.created_at.toISOString() : null,
    }));
  }

  private parseUserId(userId: string): bigint {
    try {
      return BigInt(userId);
    } catch {
      throw new BadRequestException('Invalid user id');
    }
  }
}
