import { TokenCreateTransaction, TokenType, TokenSupplyType } from "@hashgraph/sdk";
import { getHederaClient } from "./client";

export async function createRewardToken() {
  const client = getHederaClient();
  
  const transaction = new TokenCreateTransaction()
    .setTokenName("Kweli Verify Token")
    .setTokenSymbol("VFY")
    .setDecimals(2)
    .setInitialSupply(100000000)
    .setTreasuryAccountId(client.operatorAccountId)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(100000000);
  
  const txResponse = await transaction.execute(client);
  const receipt = await txResponse.getReceipt(client);
  
  return receipt.tokenId.toString();
}