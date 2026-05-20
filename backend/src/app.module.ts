import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { CreditsModule } from './credits/credits.module';
import { FeaturesModule } from './features/features.module';
import { HealthController } from './health/health.controller';
import { PackagesModule } from './packages/packages.module';
import { PrismaModule } from './prisma/prisma.module';
import { PurchasesModule } from './purchases/purchases.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().optional(),
        JWT_EXPIRES_IN: Joi.string().optional(),
        PORT: Joi.number().optional(),
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PackagesModule,
    PurchasesModule,
    TransactionsModule,
    CreditsModule,
    FeaturesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
