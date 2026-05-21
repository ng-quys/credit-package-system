import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRED_FEATURE_KEY } from './require-feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Resolve the feature code declared by @RequireFeature(...) on the route.
    const requiredFeatureCode = this.reflector.getAllAndOverride<string>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeatureCode) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id?: string } | undefined;

    if (!user?.id) {
      throw new ForbiddenException('Feature not unlocked');
    }

    // Authorization here only checks unlock state. Credit deduction happens in FeaturesService.
    const hasFeature = await this.prisma.user_features.findFirst({
      where: {
        user_id: BigInt(user.id),
        features: {
          code: requiredFeatureCode,
        },
      },
      select: {
        feature_id: true,
      },
    });

    if (!hasFeature) {
      throw new ForbiddenException('Feature not unlocked');
    }

    return true;
  }
}
