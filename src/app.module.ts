import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LiveStreamModule } from './live-stream/live-stream.module';

@Module({
  imports: [AuthModule, LiveStreamModule]
})
export class AppModule {}
