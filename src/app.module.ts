import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LiveStreamModule } from './live-stream/live-stream.module';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [LiveStreamModule, AuthModule,PassportModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
