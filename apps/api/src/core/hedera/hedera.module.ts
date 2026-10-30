import { Module, Global } from '@nestjs/common';
import { HederaClientService } from './hedera-client.service';
import { HcsService } from './hcs.service';
import { HtsService } from './hts.service';
import { HashService } from './hash.service';

@Global()
@Module({
  providers: [HederaClientService, HcsService, HtsService, HashService],
  exports: [HederaClientService, HcsService, HtsService, HashService],
})
export class HederaModule {}
