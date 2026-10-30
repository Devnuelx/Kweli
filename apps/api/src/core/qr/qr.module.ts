import { Module, Global } from '@nestjs/common';
import { QrGeneratorService } from './qr-generator.service';
// Later we can add QrEmbedderService and QrPlacementDetectorService here

@Global()
@Module({
  providers: [QrGeneratorService],
  exports: [QrGeneratorService],
})
export class QrModule {}
