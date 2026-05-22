// lib/hedera/createRewardToken.js
import {
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  AccountId,
} from "@hashgraph/sdk";
import { getHederaClient } from "./client.js";

export async function createRewardToken() {
   const client = getHederaClient();
  const transaction = await new TokenCreateTransaction()
    .setTokenName("Kweli Token")
    .setTokenSymbol("KWL")
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
    .setInitialSupply(10000000) // 10M tokens
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite)
    .freezeWith(client);

  const signTx = await transaction.signWithOperator(client);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  return receipt.tokenId.toString();
}
