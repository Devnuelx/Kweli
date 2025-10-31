// lib/hedera/transferToken.js
import { TransferTransaction, AccountId } from "@hashgraph/sdk";
import { getHederaClient } from "./client.js";

const OPERATOR_ID = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const TOKEN_ID = process.env.HEDERA_TOKEN_ID;

export async function transferTokens(receiverId, amount) {
  const client = getHederaClient();

  const tx = await new TransferTransaction()
    .addTokenTransfer(TOKEN_ID, OPERATOR_ID, -amount) // sender (you)
    .addTokenTransfer(TOKEN_ID, receiverId, amount)   // recipient
    .freezeWith(client);

  const submitTx = await tx.execute(client);
  const receipt = await submitTx.getReceipt(client);

  console.log(`✅ Transferred ${amount} tokens to ${receiverId}. Status: ${receipt.status.toString()}`);
}
