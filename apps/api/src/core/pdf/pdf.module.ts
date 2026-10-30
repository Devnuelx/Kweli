import { Module, Global } from '@nestjs/common';
import { LabelSheetService } from './label-sheet.service';
import { QrModule } from '../qr/qr.module';

@Global()
@Module({
  imports: [QrModule],
  providers: [LabelSheetService],
  exports: [LabelSheetService],
})
export class PdfModule {}
