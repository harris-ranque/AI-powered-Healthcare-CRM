import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AuthAccessTokenResponse,
  AuthMeResponse,
  AuthLogoutResponse,
  AuthService,
  AuthTokenResponse,
  OtpPendingResponse,
} from './auth.service';
import { ResendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import type { GoogleValidatedResult } from './types/google-oauth.types';
import {
  decodeGoogleOAuthState,
  getRegisterPathForOAuthState,
} from './utils/google-oauth-state.util';
import { LoginDto } from './dto/login.dto';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterSoloDto } from './dto/register-solo.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ================================
  // Register
  // ================================
  @Post('register')
  async register(
    @Body() registerDto: RegisterClinicDto,
  ): Promise<OtpPendingResponse> {
    return this.authService.registerLegacy(registerDto);
  }

  @Post('register/clinic')
  async registerClinic(
    @Body() registerDto: RegisterClinicDto,
  ): Promise<OtpPendingResponse> {
    return this.authService.startRegisterClinic(registerDto);
  }

  @Post('register/staff')
  async registerStaff(
    @Body() registerDto: RegisterStaffDto,
  ): Promise<OtpPendingResponse> {
    return this.authService.startRegisterStaff(registerDto);
  }

  @Post('register/solo')
  async registerSolo(
    @Body() registerDto: RegisterSoloDto,
  ): Promise<OtpPendingResponse> {
    return this.authService.startRegisterSolo(registerDto);
  }

  @Post('register/patient')
  async registerPatient(
    @Body() registerDto: RegisterPatientDto,
  ): Promise<OtpPendingResponse> {
    return this.authService.startRegisterPatient(registerDto);
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
  async login(@Body() loginDto: LoginDto): Promise<OtpPendingResponse> {
    return this.authService.startLogin(loginDto);
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 10,
    },
  })
  @Post('otp/verify')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthAccessTokenResponse> {
    return this.issueTokensResponse(
      res,
      await this.authService.verifyOtp(dto.otpSessionId, dto.code),
    );
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 5,
    },
  })
  @Post('otp/resend')
  async resendOtp(@Body() dto: ResendOtpDto): Promise<OtpPendingResponse> {
    return this.authService.resendOtp(dto.otpSessionId);
  }

  // ================================
  // Refresh
  // ================================
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthAccessTokenResponse> {
    try {
      const tokens = await this.authService.refreshFromCookie(
        this.parseRefreshTokenCookie(req),
      );

      this.setRefreshTokenCookie(res, tokens.refresh_token);

      return { access_token: tokens.access_token };
    } catch {
      // Stale or invalid cookie — clear it so the client is not stuck in a login ↔ dashboard loop.
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthenticatedRequest): Promise<AuthMeResponse> {
    const userId = req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }
    return this.authService.me(userId);
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

  private issueTokensResponse(
    res: Response,
    tokens: AuthTokenResponse,
  ): AuthAccessTokenResponse {
    this.setRefreshTokenCookie(res, tokens.refresh_token);
    return { access_token: tokens.access_token };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge,
    };

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      httpOnly: true,
    });

    // Lets the browser skip /auth/refresh when logged out (httpOnly cookie is not readable in JS).
    res.cookie('has_session', '1', {
      ...cookieOptions,
      httpOnly: false,
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

    this.clearAuthCookies(res);

    return result;
  }

  private clearAuthCookies(res: Response): void {
    const options = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.clearCookie('refresh_token', { ...options, httpOnly: true });
    res.clearCookie('has_session', { ...options, httpOnly: false });
  }

  // ================================
  // Google OAuth
  // ================================
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Passport handles the redirect to Google's consent screen.
  }

  @Get('google/onboarding')
  async googleOnboarding(@Req() req: Request) {
    const token = req.query.token;
    if (typeof token !== 'string' || !token) {
      throw new BadRequestException('token query parameter is required');
    }
    return this.authService.getGoogleOnboarding(token);
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const result = req.user as GoogleValidatedResult;
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    if (result.user) {
      const tokens = await this.authService.completeGoogleLogin(result.user);
      this.setRefreshTokenCookie(res, tokens.refresh_token);
      res.redirect(
        `${frontendUrl}/oauth-success?access_token=${encodeURIComponent(
          tokens.access_token,
        )}`,
      );
      return;
    }

    const oauthState = decodeGoogleOAuthState(req.query.state);
    const onboardingToken = await this.authService.signGoogleOnboardingToken(
      result.profile,
    );
    const registerPath = getRegisterPathForOAuthState(oauthState);

    res.redirect(
      `${frontendUrl}${registerPath}?onboarding=${encodeURIComponent(onboardingToken)}`,
    );
  }
}
