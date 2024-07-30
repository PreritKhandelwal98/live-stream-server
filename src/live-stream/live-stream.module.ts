import { Module } from '@nestjs/common';
import { LiveStreamGateway } from './live-stream.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [LiveStreamGateway],
})
export class LiveStreamModule {}
