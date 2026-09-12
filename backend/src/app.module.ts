import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { DetectionsModule } from './detections/detections.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SubscriptionsModule,
    DetectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
