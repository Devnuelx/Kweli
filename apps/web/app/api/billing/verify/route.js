import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import { FlutterwaveProvider } from '@/lib/services/billing/FlutterwaveProvider';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id');
    const txRef = searchParams.get('tx_ref');

    if (!transactionId || !txRef) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=MissingParams', request.url));
    }

    // Verify transaction
    const provider = new FlutterwaveProvider();
    const verification = await provider.verifyTransaction(transactionId);

    if (verification.status === 'successful') {
      // 1. Update Transaction
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('reference_id', txRef)
        .select()
        .single();

      if (txError || !tx) throw txError || new Error("Transaction not found in DB");

      // 2. Update Company Subscription Tier
      let newTier = 'pro';
      if (tx.amount >= 199) newTier = 'enterprise';

      await supabase
        .from('companies')
        .update({ subscription_tier: newTier })
        .eq('id', tx.company_id);

      return NextResponse.redirect(new URL('/dashboard/settings?success=true', request.url));
    } else {
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('reference_id', txRef);

      return NextResponse.redirect(new URL('/dashboard/settings?error=PaymentFailed', request.url));
    }

  } catch (error) {
    console.error('Billing verify error:', error);
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
