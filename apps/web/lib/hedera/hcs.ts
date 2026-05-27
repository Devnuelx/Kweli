import { 
  TopicCreateTransaction,
  TopicMessageSubmitTransaction 
} from "@hashgraph/sdk";
import { getHederaClient } from "./client";

export async function createTopic(): Promise<string> {
  const client = getHederaClient();
  
  const transaction = new TopicCreateTransaction()
    .setSubmitKey(client.operatorPublicKey!)
    .setTopicMemo("Kweli Product Verification System");
  
  const txResponse = await transaction.execute(client);
  const receipt = await txResponse.getReceipt(client);
  
  return receipt.topicId!.toString();
}

// lib/hedera/hcs.ts - Update this function

export async function submitProductToHedera(productData: Record<string, unknown>): Promise<{
  transactionId: string;
  consensusTimestamp: string;
  topicId: string;
  explorerUrl: string;
}> {
  const client = getHederaClient();
  const topicId = process.env.HEDERA_TOPIC_ID!;
  
  try {
    const message = {
      action: "REGISTER_PRODUCT",
      timestamp: new Date().toISOString(),
      data: productData
    };
    
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(message));
    
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    // Fix: Handle receipt structure properly
    return {
      transactionId: txResponse.transactionId.toString(),
      consensusTimestamp: (receipt as any).consensusTimestamp ? (receipt as any).consensusTimestamp.toString() : new Date().toISOString(),
      topicId: topicId,
      explorerUrl: `https://hashscan.io/testnet/topic/${topicId}`
    };
  } catch (error) {
    console.error("Error submitting to Hedera:", error);
    throw error;
  }
}

export async function submitVerificationToHedera(verificationData: Record<string, unknown>): Promise<{
  transactionId: string;
  consensusTimestamp: string;
  topicId: string;
  explorerUrl: string;
}> {
  const client = getHederaClient();
  const topicId = (verificationData.topicId as string) || process.env.HEDERA_TOPIC_ID!;
  
  try {
    const message = {
      action: "VERIFY_PRODUCT",
      timestamp: new Date().toISOString(),
      data: verificationData
    };
    
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(message));
    
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    return {
      transactionId: txResponse.transactionId.toString(),
      consensusTimestamp: (receipt as any).consensusTimestamp ? (receipt as any).consensusTimestamp.toString() : new Date().toISOString(),
      topicId: topicId,
      explorerUrl: `https://hashscan.io/testnet/topic/${topicId}`
    };
  } catch (error) {
    console.error("Error submitting verification to Hedera:", error);
    throw error;
  }
}
