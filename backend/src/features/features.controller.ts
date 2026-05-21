import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FEATURE_CODE } from './constants/feature.constants';
import { FeatureGuard } from './feature.guard';
import { RequireFeature } from './require-feature.decorator';
import { FeaturesService } from './features.service';

@ApiTags('Features')
@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature(FEATURE_CODE.AI_CHAT)
  @ApiBearerAuth('bearer')
  @Post('use/ai-chat')
  @ApiOperation({ summary: 'Use AI_CHAT feature and deduct credits' })
  @ApiResponse({
    status: 201,
    description: 'AI_CHAT feature used successfully',
  })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  @ApiResponse({ status: 403, description: 'Feature not unlocked' })
  useAiChatFeature(@CurrentUser() user: { id: string }) {
    return this.featuresService.useFeature(user.id, FEATURE_CODE.AI_CHAT);
  }

  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature(FEATURE_CODE.AUTO_POST)
  @ApiBearerAuth('bearer')
  @Post('use/auto-post')
  @ApiOperation({ summary: 'Use AUTO_POST feature and deduct credits' })
  @ApiResponse({
    status: 201,
    description: 'AUTO_POST feature used successfully',
  })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  @ApiResponse({ status: 403, description: 'Feature not unlocked' })
  useAutoPostFeature(@CurrentUser() user: { id: string }) {
    return this.featuresService.useFeature(user.id, FEATURE_CODE.AUTO_POST);
  }
}
