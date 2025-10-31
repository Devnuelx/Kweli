// app/api/associate/route.js
import { NextResponse } from "next/server";
import { associateToken } from "@/lib/hedera/associateToken";

export async function POST(req) {
  try {
    const { accountId, privateKey, tokenId } = await req.json();

    if (!accountId || !privateKey || !tokenId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const receipt = await associateToken(accountId, privateKey, tokenId);
    return NextResponse.json({ status: "success", receipt });
  } catch (err) {
    console.error("Association error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
