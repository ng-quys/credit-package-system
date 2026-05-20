import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PurchasesService } from './purchases.service';

@ApiTags('Purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Get('history')
  @ApiOperation({ summary: 'Get purchase history for current user' })
  @ApiResponse({ status: 200, description: 'Purchase history returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getPurchaseHistory(@CurrentUser() user: { id: string }) {
    return this.purchasesService.getPurchaseHistoryForCurrentUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Post('packages/:packageId')
  @ApiOperation({ summary: 'Purchase an active package using fake payment flow' })
  @ApiResponse({ status: 201, description: 'Package purchased successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  purchasePackage(@Param('packageId') packageId: string, @CurrentUser() user: { id: string }) {
    return this.purchasesService.purchasePackage(packageId, user.id);
  }
}
