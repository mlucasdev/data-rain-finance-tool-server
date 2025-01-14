import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AdminNotificationModule } from '../infra/gateway/app/notification/user-notifications/admin-notification/admin-notification.module';
import { ManagerNotificationModule } from '../infra/gateway/app/notification/user-notifications/manager-notification/manager-notification.module';
import { ProfessionalServicesNotificationModule } from '../infra/gateway/app/notification/user-notifications/professional-services-notifications/professional-services-notification.module';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { RequestSendOvertimeRepository } from './repositories/request-send-overtime.repository';
import { RequestSendOvertimeController } from './request-send-overtime.controller';
import { RequestSendOvertimeService } from './service/request-send-overtime.service';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    PrismaModule,
    UserModule,
    ProjectModule,
    ManagerNotificationModule,
    AdminNotificationModule,
    ProfessionalServicesNotificationModule,
  ],
  providers: [RequestSendOvertimeService, RequestSendOvertimeRepository],
  controllers: [RequestSendOvertimeController],
  exports: [RequestSendOvertimeService],
})
export class RequestSendOvertimeModule {}
