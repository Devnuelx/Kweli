// lib/hedera/associateToken.ts
import { TokenAssociateTransaction, AccountId, PrivateKey } from "@hashgraph/sdk";
import { getHederaClient } from "./client";

export async function associateToken(userAccountId: string, userPrivateKey: string, tokenId: string): Promise<void> {
  const client = getHederaClient();
  client.setOperator(AccountId.fromString(userAccountId), PrivateKey.fromString(userPrivateKey));

  const tx = await new TokenAssociateTransaction()
    .setAccountId(userAccountId)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(PrivateKey.fromString(userPrivateKey));

  const submitTx = await tx.execute(client);
  const receipt = await submitTx.getReceipt(client);

  console.log(`✅ Association for ${userAccountId} with token ${tokenId}: ${receipt.status.toString()}`);
}
