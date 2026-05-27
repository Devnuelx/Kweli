// lib/hedera/client.ts
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

export function getHederaClient(): Client {
  const client = Client.forTestnet(); // or Mainnet if you're live
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
  );
  return client;
}
