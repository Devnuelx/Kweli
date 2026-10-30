import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';

@Injectable()
export class HederaClientService implements OnModuleInit {
  private readonly logger = new Logger(HederaClientService.name);
  private client!: Client;
  private operatorId!: AccountId;
  private operatorKey!: PrivateKey;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accountId = this.configService.get<string>('HEDERA_ACCOUNT_ID');
    const privateKey = this.configService.get<string>('HEDERA_PRIVATE_KEY');
    const network = this.configService.get<string>('HEDERA_NETWORK', 'testnet');

    if (!accountId || !privateKey) {
      this.logger.warn('Hedera credentials not found. Hedera functionality will fail.');
      return;
    }

    this.operatorId = AccountId.fromString(accountId);
    this.operatorKey = PrivateKey.fromStringECDSA(privateKey);

    if (network === 'mainnet') {
      this.client = Client.forMainnet();
    } else {
      this.client = Client.forTestnet();
    }

    this.client.setOperator(this.operatorId, this.operatorKey);
    this.logger.log(`Initialized Hedera client on ${network}`);
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('Hedera client is not initialized');
    }
    return this.client;
  }

  getOperatorId(): AccountId {
    return this.operatorId;
  }

  getOperatorKey(): PrivateKey {
    return this.operatorKey;
  }
}
