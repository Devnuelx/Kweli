import { Module, Global } from '@nestjs/common';
import { ProductVerifierService } from './product-verifier.service';

@Global()
@Module({
  providers: [ProductVerifierService],
  exports: [ProductVerifierService],
})
export class AiModule {}
