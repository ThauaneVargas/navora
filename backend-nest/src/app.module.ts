import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { BeaconsModule } from './beacons/beacons.module';
import { CallsModule } from './calls/calls.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { NavigationModule } from './navigation/navigation.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OperationalMessagesModule } from './operational-messages/operational-messages.module';
import { PatientsModule } from './patients/patients.module';
import { ReportsModule } from './reports/reports.module';
import { VisitorAccessModule } from './visitor-access/visitor-access.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    DatabaseModule,
    AuthModule,
    HealthModule,
    CallsModule,
    CheckInsModule,
    VisitorAccessModule,
    DashboardModule,
    BeaconsModule,
    NavigationModule,
    NotificationsModule,
    OperationalMessagesModule,
    PatientsModule,
    ReportsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
