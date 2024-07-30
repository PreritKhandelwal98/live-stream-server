import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Replace this with actual user validation logic
    const user = { username: 'test', password: 'test' };
    if (username === user.username && password === user.password) {
      return { username: user.username };
    }
    return null;
  }
}
