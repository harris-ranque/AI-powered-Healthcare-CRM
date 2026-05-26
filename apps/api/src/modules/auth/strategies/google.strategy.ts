import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Profile, StrategyOptions } from 'passport-google-oauth20';

import { AuthService, type GoogleAuthResult } from '../auth.service';
import { GooglePassportStrategy } from './google-passport.strategy';

@Injectable()
export class GoogleStrategy extends GooglePassportStrategy {
  constructor(private readonly authService: AuthService) {
    const options: StrategyOptions = {
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
      scope: ['email', 'profile'],
    };
    super(options);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GoogleAuthResult> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    return await this.authService.validateGoogleUser({
      googleId: profile.id,
      email,
      name: profile.displayName,
    });
  }
}
