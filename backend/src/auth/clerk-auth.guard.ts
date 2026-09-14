import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';

/** `request.auth` once a token has been verified. */
export interface AuthContext {
  userId: string;
  sessionId?: string;
}

/**
 * Verifies the Clerk session JWT on incoming requests and puts the Clerk user
 * id on `request.auth`.
 *
 * With no CLERK_SECRET_KEY set the guard stays out of the way, so local
 * development against the API keeps working before Clerk is configured.
 *
 * NOT YET APPLIED GLOBALLY: subscriptions and detections are still stored
 * without an owner, so there is nothing to scope a verified user to. Apply it
 * in `main.ts` (`app.useGlobalGuards(...)`) as part of adding the User model.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private warnedUnconfigured = false;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      if (!this.warnedUnconfigured) {
        this.warnedUnconfigured = true;
        this.logger.warn(
          'CLERK_SECRET_KEY is not set — requests are passing through unauthenticated.',
        );
      }
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    try {
      const claims = await verifyToken(token, { secretKey });
      const auth: AuthContext = { userId: claims.sub, sessionId: claims.sid };
      req.auth = auth;
      return true;
    } catch (err) {
      this.logger.debug(
        `Token verification failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new UnauthorizedException('Invalid or expired session token');
    }
  }
}
