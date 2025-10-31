// app/api/setup/route.js
import { NextResponse } from "next/server";
import { createTopic } from "@/lib/hedera/hcs";
import { createRewardToken } from "@/lib/hedera/creatRewardToken";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    let topicId = process.env.HEDERA_TOPIC_ID;
    let tokenId = process.env.HEDERA_TOKEN_ID;

    // Create topic if missing
    if (!topicId) {
      topicId = await createTopic();
    }

    // Create token if missing
    if (!tokenId) {
      tokenId = await createRewardToken();
    }

    return NextResponse.json({
      success: true,
      message: "Setup complete. Add these to .env.local if not already present:",
      topicId,
      tokenId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
