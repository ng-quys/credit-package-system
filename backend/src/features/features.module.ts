import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureGuard } from './feature.guard';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';

@Module({
  imports: [PrismaModule],
  controllers: [FeaturesController],
  providers: [FeatureGuard, FeaturesService],
})
export class FeaturesModule {}
