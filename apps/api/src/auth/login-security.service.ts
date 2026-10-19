import { Injectable } from '@nestjs/common';

type Bucket = {
  count: number;
  windowStart: number;
  blockedUntil: number;
};

/**
 * Protección en memoria contra fuerza bruta:
 * - límite por IP
 * - límite por email
 * - bloqueo temporal tras demasiados fallos
 */
@Injectable()
export class LoginSecurityService {
  private readonly byIp = new Map<string, Bucket>();
  private readonly byEmail = new Map<string, Bucket>();

  readonly maxFailures = Number(process.env.LOGIN_MAX_FAILURES || 5);
  readonly windowMs = Number(process.env.LOGIN_WINDOW_MS || 15 * 60 * 1000);
  readonly lockMs = Number(process.env.LOGIN_LOCK_MS || 15 * 60 * 1000);
  readonly maxRequestsPerIp = Number(process.env.LOGIN_MAX_IP_REQUESTS || 30);

  assertAllowed(ip: string, email: string) {
    const now = Date.now();
    this.prune(this.byIp, now);
    this.prune(this.byEmail, now);

    const ipBucket = this.touch(this.byIp, ip, now);
    const emailBucket = this.touch(this.byEmail, this.norm(email), now);

    if (ipBucket.blockedUntil > now || emailBucket.blockedUntil > now) {
      const retrySec = Math.ceil(
        (Math.max(ipBucket.blockedUntil, emailBucket.blockedUntil) - now) /
          1000,
      );
      return {
        allowed: false as const,
        retryAfterSec: Math.max(1, retrySec),
        reason: 'locked' as const,
      };
    }

    if (ipBucket.count > this.maxRequestsPerIp) {
      ipBucket.blockedUntil = now + this.lockMs;
      return {
        allowed: false as const,
        retryAfterSec: Math.ceil(this.lockMs / 1000),
        reason: 'rate' as const,
      };
    }

    return { allowed: true as const };
  }

  registerFailure(ip: string, email: string) {
    const now = Date.now();
    const ipBucket = this.touch(this.byIp, ip, now);
    const emailBucket = this.touch(this.byEmail, this.norm(email), now);
    ipBucket.count += 1;
    emailBucket.count += 1;

    if (emailBucket.count >= this.maxFailures) {
      emailBucket.blockedUntil = now + this.lockMs;
    }
    if (ipBucket.count >= this.maxFailures * 3) {
      ipBucket.blockedUntil = now + this.lockMs;
    }
  }

  registerSuccess(ip: string, email: string) {
    this.byEmail.delete(this.norm(email));
    const ipBucket = this.byIp.get(ip);
    if (ipBucket) {
      ipBucket.count = Math.max(0, ipBucket.count - 1);
    }
  }

  /** Solo pruebas: limpia estado en memoria. */
  resetForTests() {
    this.byIp.clear();
    this.byEmail.clear();
  }

  private norm(email: string) {
    return email.trim().toLowerCase();
  }

  private touch(map: Map<string, Bucket>, key: string, now: number): Bucket {
    let bucket = map.get(key);
    if (!bucket || now - bucket.windowStart > this.windowMs) {
      bucket = { count: 0, windowStart: now, blockedUntil: 0 };
      map.set(key, bucket);
    }
    return bucket;
  }

  private prune(map: Map<string, Bucket>, now: number) {
    for (const [key, bucket] of map) {
      if (
        bucket.blockedUntil < now &&
        now - bucket.windowStart > this.windowMs
      ) {
        map.delete(key);
      }
    }
  }
}
