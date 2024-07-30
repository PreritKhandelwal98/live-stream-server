import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  private users = [{ username: 'user', password: 'password' }]; // Example user data

  async validateUser(username: string, password: string): Promise<any> {
    const user = this.users.find(user => user.username === username && user.password === password);
    return user ? { username: user.username } : null;
  }
}
