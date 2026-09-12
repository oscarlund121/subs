import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Verifies the Clerk session JWT on incoming requests.
 *
 * SCAFFOLD NOTE: Clerk is not configured yet (no CLERK_SECRET_KEY), so the
 * guard currently allows requests through. Once we set CLERK_SECRET_KEY we
 * wire up @clerk/backend's `verifyToken` here and apply the guard globally:
 *   app.useGlobalGuards(new ClerkAuthGuard());
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      return true; // auth not configured yet (scaffold phase)
    }

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    // TODO: verify with Clerk — see @clerk/backend `verifyToken(token, { secretKey })`.
    // For now this is a placeholder; real verification lands with Clerk setup.
    throw new UnauthorizedException('Clerk verification not yet wired up');
  }
}
