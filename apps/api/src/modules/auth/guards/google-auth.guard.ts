import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import type { GoogleValidatedResult } from '../types/google-oauth.types';
import type { GoogleOAuthState } from '../types/google-oauth.types';
import { encodeGoogleOAuthState } from '../utils/google-oauth-state.util';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const persona = req.query.persona === 'provider' ? 'provider' : 'client';
    const providerType =
      req.query.providerType === 'individual' ? 'individual' : 'org';

    const state: GoogleOAuthState = { persona, providerType };

    return {
      scope: ['email', 'profile'],
      state: encodeGoogleOAuthState(state),
      // Always show the Google account picker instead of silently reusing the
      // last signed-in account.
      prompt: 'select_account',
    };
  }

  handleRequest<TUser = GoogleValidatedResult>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const res = context.switchToHttp().getResponse<Response>();

    if (err) {
      this.redirectOAuthFailure(res);
      throw err;
    }

    if (!user) {
      this.redirectOAuthFailure(res);
      throw new UnauthorizedException('Google authentication failed');
    }

    return user;
  }

  private redirectOAuthFailure(res: Response): void {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
}
