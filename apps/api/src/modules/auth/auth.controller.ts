import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  Get,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AuthAccessTokenResponse,
  AuthLogoutResponse,
  AuthService,
  AuthTokenResponse,
  GoogleAuthResult,
} from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ================================
  // Register
  // ================================
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthTokenResponse> {
    return this.authService.register(registerDto);
  }

  // ================================
  // Login
  // ================================
  @Throttle({
    default: {
      ttl: 60000,

      limit: 5,
    },
  })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthAccessTokenResponse> {
    const tokens = await this.authService.login(loginDto);

    this.setRefreshTokenCookie(res, tokens.refresh_token);

    return { access_token: tokens.access_token };
  }

  // ================================
  // Refresh
  // ================================
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthAccessTokenResponse> {
    const tokens = await this.authService.refreshFromCookie(
      this.parseRefreshTokenCookie(req),
    );

    this.setRefreshTokenCookie(res, tokens.refresh_token);

    return { access_token: tokens.access_token };
  }

  private parseBearerToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (typeof authHeader !== 'string') {
      return undefined;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }

  private parseRefreshTokenCookie(req: Request): string | undefined {
    const rawCookies: unknown = req.cookies;
    if (typeof rawCookies !== 'object' || rawCookies === null) {
      return undefined;
    }

    const value = (rawCookies as Record<string, unknown>)['refresh_token'];
    return typeof value === 'string' ? value : undefined;
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  // ================================
  // Logout
  // ================================
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLogoutResponse> {
    const result = await this.authService.logoutFromCookie(
      this.parseRefreshTokenCookie(req),
      this.parseBearerToken(req),
    );

    this.clearRefreshTokenCookie(res);

    return result;
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  // ================================
  // Google OAuth
  // ================================
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Passport handles the redirect to Google's consent screen.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthCallback(@Req() req: Request, @Res() res: Response): void {
    const { tokens } = req.user as GoogleAuthResult;

    this.setRefreshTokenCookie(res, tokens.refresh_token);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/oauth-success?access_token=${encodeURIComponent(
        tokens.access_token,
      )}`,
    );
  }
}
