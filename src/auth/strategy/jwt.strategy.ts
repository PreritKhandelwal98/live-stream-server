import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          let token = null;
          if (req && req.headers) {
            token = req.headers.authorization?.split(' ')[1] || null;
          } else if (req.handshake && req.handshake.query && req.handshake.query.token) {
            token = req.handshake.query.token;
          }
          return token;
        },
      ]),
      secretOrKey: 'secretKey', // Replace with a secure key
    });
  }

  async validate(payload: any) {
    return { username: payload.username };
  }
}
