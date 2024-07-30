import { Module } from '@nestjs/common';
import { LiveStreamGateway } from './live-stream.gateway';

@Module({
  providers: [LiveStreamGateway],
})
export class LiveStreamModule {}
