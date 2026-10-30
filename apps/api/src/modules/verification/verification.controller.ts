import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { VerificationService } from './verification.service';
import { VerifyProductAiDto, ScanProductDto } from './dto/verify-product.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('ai')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Visual packaging analysis via multimodal AI' })
  async verifyWithAi(
    @CurrentUser() user: any,
    @Body() dto: VerifyProductAiDto,
  ) {
    return this.verificationService.verifyWithAi(user?.id || null, dto);
  }

  @Post('scan')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Verify product unit with public serial & scratch PIN' })
  async scanQr(
    @CurrentUser() user: any,
    @Body() dto: ScanProductDto,
    @Req() req: Request,
  ) {
    if (!dto.ipAddress) {
      dto.ipAddress =
        (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    }
    if (!dto.userAgent) {
      dto.userAgent = req.headers['user-agent'];
    }

    return this.verificationService.scanQrCode(user?.id || null, dto);
  }
}
