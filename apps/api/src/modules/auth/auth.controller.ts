import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterBrandDto } from './dto/register-brand.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const REFRESH_COOKIE_NAME = 'kweli_refresh_token';

const getCookieOptions = (isProduction: boolean): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new consumer account' })
  @ApiResponse({ status: 201, description: 'Consumer registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerConsumer(dto);
  }

  @Public()
  @Post('register/brand')
  @ApiOperation({ summary: 'Register a new brand manufacturer & organization' })
  @ApiResponse({ status: 201, description: 'Brand and administrator created' })
  @ApiResponse({ status: 409, description: 'Email or registration number already in use' })
  async registerBrand(@Body() dto: RegisterBrandDto) {
    return this.authService.registerBrand(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and receive access token & refresh cookie' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(dto, { ipAddress, userAgent });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getCookieOptions(isProduction),
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken, // Also returned in body for non-browser/mobile clients
      expiresAt: result.expiresAt,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and obtain a fresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired session' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken =
      req.cookies?.[REFRESH_COOKIE_NAME] || dto.refreshToken;

    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.refreshToken(rawToken, {
      ipAddress,
      userAgent,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getCookieOptions(isProduction),
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      user: result.user,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active refresh session and clear cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken =
      req.cookies?.[REFRESH_COOKIE_NAME] || dto.refreshToken;

    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...getCookieOptions(isProduction),
      maxAge: 0,
    });

    return this.authService.logout(rawToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get current authenticated user profile and memberships' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  // ==========================================
  // COMPATIBILITY ALIASES FOR LEGACY CLIENTS
  // ==========================================

  @Public()
  @Post('consumer/signup')
  @HttpCode(HttpStatus.CREATED)
  async legacyConsumerSignup(@Body() dto: RegisterDto) {
    return this.register(dto);
  }

  @Public()
  @Post('consumer/login')
  @HttpCode(HttpStatus.OK)
  async legacyConsumerLogin(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.login(dto, req, res);
  }

  @Public()
  @Post('company/signup')
  @HttpCode(HttpStatus.CREATED)
  async legacyCompanySignup(@Body() dto: RegisterBrandDto) {
    return this.registerBrand(dto);
  }

  @Public()
  @Post('company/login')
  @HttpCode(HttpStatus.OK)
  async legacyCompanyLogin(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.login(dto, req, res);
  }
}
