import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuthModule } from './auth/auth.module';
import { BeaconsModule } from './beacons/beacons.module';
import { CallsModule } from './calls/calls.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { HospitalMiddleware } from './hospitals/hospital.middleware';
import { HospitalsModule } from './hospitals/hospitals.module';
import { NavigationModule } from './navigation/navigation.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OperationalMessagesModule } from './operational-messages/operational-messages.module';
import { PatientsModule } from './patients/patients.module';
import { PrivacyModule } from './privacy/privacy.module';
import { ReportsModule } from './reports/reports.module';
import { StaffModule } from './staff/staff.module';
import { VisitorAccessModule } from './visitor-access/visitor-access.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    DatabaseModule,
    HospitalsModule,
    PrivacyModule,
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
    StaffModule,
  ],
  // `useExisting` (e não `useClass`) é o padrão da doc do NestJS pra guard global
  // poder ser substituído em teste via `overrideProvider(ThrottlerGuard)`.
  // Em produção o comportamento é idêntico: o mesmo ThrottlerGuard vale pra todas as rotas.
  providers: [
    ThrottlerGuard,
    { provide: APP_GUARD, useExisting: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements NestModule {
  // Header X-Hospital -> hospital da requisicao (ver hospitals/).
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HospitalMiddleware).forRoutes('*');
  }
}
