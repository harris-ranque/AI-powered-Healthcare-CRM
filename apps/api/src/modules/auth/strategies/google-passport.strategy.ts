import type { Type } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

/** CJS strategy export; cast so Nest's PassportStrategy mixin is typed for ESLint. */
const GoogleOAuth20Strategy = Strategy as Type;

export abstract class GooglePassportStrategy extends PassportStrategy(
  GoogleOAuth20Strategy,
  'google',
) {}
