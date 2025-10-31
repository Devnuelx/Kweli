// lib/hedera/mintToken.js
import {
  TokenMintTransaction,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";
import { getHederaClient } from "./client.js";

// Load from env
const OPERATOR_ID = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const OPERATOR_KEY = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
const TOKEN_ID = process.env.HEDERA_TOKEN_ID; // The token you created

export async function mintTokens(amount) {
  const client = getHederaClient();

  const tx = await new TokenMintTransaction()
    .setTokenId(TOKEN_ID)
    .setAmount(amount) // how many tokens you want to mint
    .freezeWith(client)
    .sign(OPERATOR_KEY);

  const submitTx = await tx.execute(client);
  const receipt = await submitTx.getReceipt(client);

  console.log(`✅ Minted ${amount} tokens. Status: ${receipt.status.toString()}`);
  return receipt;
}
