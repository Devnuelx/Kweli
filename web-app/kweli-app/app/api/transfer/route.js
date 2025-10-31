// app/api/transfer/route.js
import { NextResponse } from "next/server";
import { transferTokens } from "@/lib/hedera/transferToken";
import { supabase } from "@/lib/supabase/supabase";

export async function POST(req) {
  try {
    const { receiverId, amount, userId, description } = await req.json();

    if (!receiverId || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Execute Hedera token transfer
    const receipt = await transferTokens(receiverId, amount);
    const transactionId = receipt?.transactionId?.toString();
    
    // Log transaction to database if userId is provided
    if (userId) {
      try {
        // Find user by Hedera account ID
        const { data: receiver } = await supabase
          .from('users')
          .select('id')
          .eq('hedera_account_id', receiverId)
          .single();
        
        // Log the transaction
        await supabase
          .from('token_transactions')
          .insert({
            user_id: receiver?.id || userId,
            transaction_type: 'transfer',
            amount: parseFloat(amount),
            description: description || `Token transfer from treasury to ${receiverId}`,
            hedera_transaction_id: transactionId
          });
          
        // Update user's total rewards
        if (receiver) {
          await supabase
            .from('users')
            .update({
              total_rewards: supabase.raw(`total_rewards + ${amount}`)
            })
            .eq('id', receiver.id);
        }
      } catch (dbError) {
        console.error('Database logging error:', dbError);
        // Continue even if database logging fails
      }
    }
    
    return NextResponse.json({ 
      status: "success", 
      receipt,
      transactionId
    });
  } catch (err) {
    console.error("Transfer error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
