import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Profile, StrategyOptions } from 'passport-google-oauth20';

import { AuthService } from '../auth.service';
import type { GoogleValidatedResult } from '../types/google-oauth.types';
import { GooglePassportStrategy } from './google-passport.strategy';

@Injectable()
export class GoogleStrategy extends GooglePassportStrategy {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly authService: AuthService,
    config: ConfigService,
  ) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL') ?? '';

    const options: StrategyOptions = {
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    };
    super(options);

    if (!callbackURL.includes('/api/v1/auth/google/callback')) {
      this.logger.warn(
        `GOOGLE_CALLBACK_URL should be http://localhost:3001/api/v1/auth/google/callback (current: "${callbackURL}"). ` +
          'Add the exact URL to Google Cloud Console → Credentials → Authorized redirect URIs.',
      );
    } else {
      this.logger.log(
        `Google OAuth redirect URI (register in Google Console): ${callbackURL}`,
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GoogleValidatedResult> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    const user = await this.authService.findGoogleUser({
      googleId: profile.id,
      email,
      name: profile.displayName,
    });

    return {
      user,
      profile: {
        googleId: profile.id,
        email,
        name: profile.displayName,
      },
    };
  }
}
