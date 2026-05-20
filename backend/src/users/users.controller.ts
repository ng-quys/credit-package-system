import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Get('me/credits')
  @ApiOperation({ summary: 'Get current user credit balance' })
  @ApiResponse({ status: 200, description: 'Credit balance returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyCredits(@CurrentUser() user: { id: string }) {
    return this.usersService.getCreditsForCurrentUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Get('me/features')
  @ApiOperation({ summary: 'Get unlocked features for current user' })
  @ApiResponse({ status: 200, description: 'Unlocked features returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyFeatures(@CurrentUser() user: { id: string }) {
    return this.usersService.getUnlockedFeaturesForCurrentUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Get('me/credit-usages')
  @ApiOperation({ summary: 'Get credit usage history for current user' })
  @ApiResponse({ status: 200, description: 'Credit usage history returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyCreditUsages(@CurrentUser() user: { id: string }) {
    return this.usersService.getCreditUsageHistoryForCurrentUser(user.id);
  }
}
