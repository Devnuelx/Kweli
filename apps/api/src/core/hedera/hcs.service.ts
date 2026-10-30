import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { HederaClientService } from './hedera-client.service';
import { TopicCreateTransaction, TopicMessageSubmitTransaction, TopicId } from '@hashgraph/sdk';

@Injectable()
export class HcsService {
  private readonly logger = new Logger(HcsService.name);

  constructor(private readonly hederaClient: HederaClientService) {}

  async createTopic(memo: string = 'Kweli Product Verification System'): Promise<string> {
    try {
      const client = this.hederaClient.getClient();
      const transaction = new TopicCreateTransaction().setTopicMemo(memo);
      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      if (!receipt.topicId) {
        throw new Error('Failed to create topic');
      }
      
      return receipt.topicId.toString();
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating Hedera topic: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to create Hedera topic');
    }
  }

  async submitProductToHedera(data: { action: string; productData: any; topicId: string }): Promise<string> {
    try {
      const client = this.hederaClient.getClient();
      const message = JSON.stringify({
        action: data.action,
        timestamp: new Date().toISOString(),
        data: data.productData,
      });

      const transaction = new TopicMessageSubmitTransaction({
        topicId: TopicId.fromString(data.topicId),
        message,
      });

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      return txResponse.transactionId.toString();
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error submitting product to Hedera: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to submit product to blockchain');
    }
  }

  async submitVerificationToHedera(data: { productId: string; hash: string; status: string; topicId: string }): Promise<string> {
    try {
      const client = this.hederaClient.getClient();
      const message = JSON.stringify({
        action: 'VERIFY_PRODUCT',
        timestamp: new Date().toISOString(),
        data: {
          productId: data.productId,
          hash: data.hash,
          status: data.status,
        },
      });

      const transaction = new TopicMessageSubmitTransaction({
        topicId: TopicId.fromString(data.topicId),
        message,
      });

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      return txResponse.transactionId.toString();
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error submitting verification to Hedera: ${err.message}`, err.stack);
      // We don't throw here usually because verification logs shouldn't break the user flow
      return null as any;
    }
  }
}
