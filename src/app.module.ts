import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LiveStreamModule } from './live-stream/live-stream.module';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [AuthModule, LiveStreamModule],
  providers: [ChatGateway],
})
export class AppModule {}
