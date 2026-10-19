import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginSecurityService } from './login-security.service';

/** Hash bcrypt válido (no corresponde a ninguna clave real) para igualar tiempos. */
const DUMMY_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly security: LoginSecurityService,
  ) {}

  async login(emailRaw: string, password: string, ip = 'unknown') {
    const email = emailRaw.trim().toLowerCase();

    // Límite de longitud evita DoS con bcrypt sobre strings enormes.
    if (password.length > 128) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const gate = this.security.assertAllowed(ip, email);
    if (!gate.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'Demasiados intentos de acceso. Espera unos minutos e inténtalo de nuevo.',
          retryAfterSec: gate.retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.adminUser.findUnique({ where: { email } });

    // Si la cuenta está bloqueada en BD, rechazar.
    if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const retryAfterSec = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 1000,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'Cuenta temporalmente bloqueada por intentos fallidos. Intenta más tarde.',
          retryAfterSec: Math.max(1, retryAfterSec),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const hash = user?.passwordHash || DUMMY_HASH;
    let ok = false;
    try {
      ok = await bcrypt.compare(password, hash);
    } catch {
      ok = false;
    }

    if (!user || !ok) {
      this.security.registerFailure(ip, email);
      if (user) {
        await this.recordFailure(user.id, user.failedLoginAttempts);
      }
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.security.registerSuccess(ip, email);
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken: token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  private async recordFailure(userId: string, previous: number) {
    const next = previous + 1;
    const lock =
      next >= this.security.maxFailures
        ? new Date(Date.now() + this.security.lockMs)
        : null;
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: next,
        lockedUntil: lock,
      },
    });
  }
}
