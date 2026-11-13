import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { AiService } from '../ai/ai.service';

@Module({
  controllers: [ReportsController],
  providers: [AiService],
})
export class ReportsModule {}