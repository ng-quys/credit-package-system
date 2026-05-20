import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackagesService } from './packages.service';

@ApiTags('Packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active packages' })
  @ApiResponse({ status: 200, description: 'Active packages returned' })
  findActivePackages() {
    return this.packagesService.findActivePackages();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @Get('admin')
  @ApiOperation({ summary: 'Get all packages for admin, including inactive ones' })
  @ApiResponse({ status: 200, description: 'All packages returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAllPackagesForAdmin() {
    return this.packagesService.findAllPackagesForAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @Post('admin')
  @ApiOperation({ summary: 'Create a new package as admin' })
  @ApiBody({ type: CreatePackageDto })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createPackage(@Body() dto: CreatePackageDto) {
    return this.packagesService.createPackageForAdmin(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @Put('admin/:id')
  @ApiOperation({ summary: 'Update a package as admin' })
  @ApiResponse({ status: 200, description: 'Package updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.updatePackageForAdmin(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Soft delete a package as admin' })
  @ApiResponse({ status: 200, description: 'Package soft deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  deletePackage(@Param('id') id: string) {
    return this.packagesService.softDeletePackageForAdmin(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package detail for an active package' })
  @ApiResponse({ status: 200, description: 'Package detail returned' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  findActivePackageById(@Param('id') id: string) {
    return this.packagesService.findPackageDetail(id);
  }
}
