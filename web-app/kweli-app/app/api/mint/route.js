// app/api/mint/route.js
import { NextResponse } from "next/server";
import { mintTokens } from "@/lib/hedera/mintToken";

export async function POST(req) {
  try {
    const { amount } = await req.json();
    if (!amount) return NextResponse.json({ error: "Amount required" }, { status: 400 });

    const receipt = await mintTokens(amount);
    return NextResponse.json({ status: "success", receipt });
  } catch (err) {
    console.error("Mint error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
