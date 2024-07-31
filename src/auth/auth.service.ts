import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly adminUsername = 'admin';
  private readonly adminPassword = 'admin';
  private readonly viewerUsername = 'test';
  private readonly viewerPassword = 'test';

  constructor(private jwtService: JwtService) {}

  validateUser(username: string, password: string): string | null {
    if (username === this.adminUsername && password === this.adminPassword) {
      return 'admin';
    }
    if (username === this.viewerUsername && password === this.viewerPassword) {
      return 'viewer';
    }
    return null;
  }

  async login(username: string, password: string): Promise<{ access_token: string } | null> {
    const role = this.validateUser(username, password);
    if (!role) return null;

    const payload = { username, role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  isAdmin(role: string): boolean {
    return role === 'admin';
  }
}