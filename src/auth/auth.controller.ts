import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string, password: string }) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (user) {
      // Implement token generation and return token here
      return { accessToken: 'token' };
    } else {
      return { message: 'Invalid credentials' };
    }
  }
}
