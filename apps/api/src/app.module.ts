import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Core modules
import { DatabaseModule } from './core/database/database.module';
import { HederaModule } from './core/hedera/hedera.module';
import { AiModule } from './core/ai/ai.module';
import { StorageModule } from './core/storage/storage.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { QrModule } from './core/qr/qr.module';
import { CsvModule } from './core/csv/csv.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { VerificationModule } from './modules/verification/verification.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting (global defaults)
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 5 },     // 5 req/sec
      { name: 'medium', ttl: 60000, limit: 60 },   // 60 req/min
      { name: 'long', ttl: 3600000, limit: 1000 },  // 1000 req/hr
    ]),

    // Core infrastructure
    DatabaseModule,
    HederaModule,
    AiModule,
    StorageModule,
    NotificationsModule,
    QrModule,
    CsvModule,

    // Feature modules
    AuthModule,
    ProductsModule,
    VerificationModule,
    ReportsModule,
    CampaignsModule,
    ApiKeysModule,
  ],
  providers: [
    // Apply throttler globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
