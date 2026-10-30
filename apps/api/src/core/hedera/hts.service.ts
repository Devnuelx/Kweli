import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HederaClientService } from './hedera-client.service';
import { 
  TransferTransaction, 
  TokenMintTransaction, 
  TokenAssociateTransaction, 
  TokenId, 
  AccountId, 
  PrivateKey,
  Client
} from '@hashgraph/sdk';

@Injectable()
export class HtsService {
  private readonly logger = new Logger(HtsService.name);

  constructor(
    private readonly hederaClient: HederaClientService,
    private readonly configService: ConfigService,
  ) {}

  private getTokenId(): string {
    const tokenId = this.configService.get<string>('HEDERA_TOKEN_ID');
    if (!tokenId) {
      throw new Error('HEDERA_TOKEN_ID not configured');
    }
    return tokenId;
  }

  async transferTokens(receiverId: string, amount: number): Promise<{ transactionId: string }> {
    try {
      const client = this.hederaClient.getClient();
      const operatorId = this.hederaClient.getOperatorId();
      const tokenId = TokenId.fromString(this.getTokenId());
      const accountId = AccountId.fromString(receiverId);
      
      // Amount usually needs to be multiplied by 10^decimals (assuming 2 decimals for VFY)
      const tokenAmount = Math.floor(amount * 100);

      const transaction = new TransferTransaction()
        .addTokenTransfer(tokenId, operatorId, -tokenAmount)
        .addTokenTransfer(tokenId, accountId, tokenAmount);

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      return { transactionId: txResponse.transactionId.toString() };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error transferring tokens: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to transfer tokens on Hedera');
    }
  }

  async mintTokens(amount: number): Promise<{ transactionId: string }> {
    try {
      const client = this.hederaClient.getClient();
      const tokenId = TokenId.fromString(this.getTokenId());
      
      const tokenAmount = Math.floor(amount * 100);

      const transaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(tokenAmount);

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      return { transactionId: txResponse.transactionId.toString() };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error minting tokens: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to mint tokens on Hedera');
    }
  }

  async associateToken(accountIdStr: string, privateKeyStr: string): Promise<void> {
    try {
      const tokenId = TokenId.fromString(this.getTokenId());
      const accountId = AccountId.fromString(accountIdStr);
      const privateKey = PrivateKey.fromStringECDSA(privateKeyStr);
      
      const network = this.configService.get<string>('HEDERA_NETWORK', 'testnet');
      const tempClient = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
      tempClient.setOperator(accountId, privateKey);

      const transaction = new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([tokenId]);

      const txResponse = await transaction.execute(tempClient);
      await txResponse.getReceipt(tempClient);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error associating token: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to associate token on Hedera');
    }
  }
}
